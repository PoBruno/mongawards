document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const categoryDisplay = document.getElementById('category-display');
    const categoryBannerContainer = document.getElementById('category-banner-container');
    const categoryName = document.getElementById('category-name');
    const categoryDescription = document.getElementById('category-description');
    const nomineesList = document.getElementById('nominees-list');
    const voteButton = document.getElementById('vote-button');
    const votedMessage = document.getElementById('voted-message');
    const adminButton = document.getElementById('admin-button');
    const spotlightToggleBtn = document.getElementById('spotlight-toggle');
    const spotlights = document.querySelectorAll('.spotlight');
    const logoutButton = document.getElementById('logout-button');

    // Global State
    let allCategories = [];
    let allNominees = [];
    let allIndicadosCategorias = [];
    let userVotedCategoryIds = [];
    let currentCategoryIndex = 0;
    let spotlightsOn = true;

    // Check admin status and show button
    try {
        const isAdmin = await fetchData('/check-admin');
        if (isAdmin) {
            adminButton.classList.remove('hidden');
        }
    } catch (error) {
        // If check-admin fails, it means user is not authenticated
        window.location.href = '/';
        return;
    }

    // Toggle Spotlights
    spotlightToggleBtn.addEventListener('click', () => {
        spotlightsOn = !spotlightsOn;
        spotlights.forEach(spotlight => {
            spotlight.classList.toggle('active', spotlightsOn);
        });
        spotlightToggleBtn.textContent = spotlightsOn ? 'Turn Off Spotlights' : 'Turn On Spotlights';
    });

    // Logout
    logoutButton.addEventListener('click', async () => {
        try {
            await fetchData('/logout', 'POST');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    });

    async function fetchData(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (response.status === 401) {
            window.location.href = '/'; // Redirect to login if not authenticated
            throw new Error('Not authenticated');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail);
        }

        return response.json();
    }

    async function loadAllData() {
        try {
            const [fetchedCategories, fetchedNominees, fetchedIndicadosCategorias, votedIds] = await Promise.all([
                fetchData('/categorias/'),
                fetchData('/indicados/'),
                fetchData('/indicados_categorias/'),
                fetchData('/votos_usuario/')
            ]);

            allNominees = fetchedNominees;
            allIndicadosCategorias = fetchedIndicadosCategorias;
            userVotedCategoryIds = votedIds;

            allCategories = fetchedCategories.filter(cat => 
                cat.is_active && !userVotedCategoryIds.includes(cat.id)
            );

            if (allCategories.length > 0) {
                renderCategory(0);
            } else {
                categoryDisplay.innerHTML = '<p class="text-center text-gray-500 text-xl p-10">Nenhuma categoria disponível para votação no momento ou você já votou em todas.</p>';
                voteButton.disabled = true;
            }
        } catch (error) {
            console.error(`Erro ao carregar dados: ${error.message}`);
        }
    }

    function renderCategory(index) {
        if (index < 0 || index >= allCategories.length) return;

        currentCategoryIndex = index;
        const category = allCategories[currentCategoryIndex];

        if (category.banner) {
            categoryBannerContainer.innerHTML = `<img src="${category.banner}" alt="${category.nome}" class="w-full h-full object-cover">`;
        } else {
            categoryBannerContainer.innerHTML = '<div class="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 text-xl font-bold">Sem Banner</div>';
        }

        categoryName.textContent = category.nome;
        categoryDescription.textContent = category.descricao;

        nomineesList.innerHTML = '';
        const nomineesForCategory = allIndicadosCategorias
            .filter(link => link.categoria_id === category.id)
            .map(link => allNominees.find(nom => nom.id === link.indicado_id))
            .filter(nom => nom);

        nomineesForCategory.forEach(nominee => {
            const div = document.createElement('div');
            div.className = 'flex items-center p-3 bg-gray-800 rounded-lg shadow-md';
            div.innerHTML = `
                <input type="radio" id="nominee-${nominee.id}" name="selected_nominee" value="${nominee.id}" class="form-radio h-5 w-5 text-pink-500 bg-gray-700 border-gray-600 focus:ring-pink-500">
                <label for="nominee-${nominee.id}" class="ml-4 text-lg font-medium text-white flex items-center nominee-label">
                    ${nominee.foto ? `<img src="${nominee.foto}" alt="${nominee.nome}" class="w-14 h-14 rounded-full mr-4 object-cover border-2 border-pink-500">` : ''}
                    ${nominee.nome}
                </label>
            `;
            nomineesList.appendChild(div);
        });

        votedMessage.classList.add('hidden');
        voteButton.disabled = false;

        if (spotlightsOn) {
            spotlights.forEach(spotlight => spotlight.classList.add('active'));
        }
    }

    async function submitVote() {
        const selectedNominee = document.querySelector('input[name="selected_nominee"]:checked');
        if (!selectedNominee) {
            alert('Por favor, selecione um indicado para votar.');
            return;
        }

        const indicadoId = parseInt(selectedNominee.value);
        const categoriaId = allCategories[currentCategoryIndex].id;

        try {
            await fetchData('/votar/', 'POST', { indicado_id: indicadoId, categoria_id: categoriaId });
            userVotedCategoryIds.push(categoriaId);

            allCategories = allCategories.filter(cat => cat.id !== categoriaId);

            if (allCategories.length > 0) {
                renderCategory(0); // Render first available category
            } else {
                categoryDisplay.innerHTML = '<p class="text-center text-gray-500 text-xl p-10">Você já votou em todas as categorias disponíveis!</p>';
                voteButton.disabled = true;
            }

        } catch (error) {
            alert(`Erro ao registrar voto: ${error.message}`);
        }
    }

    voteButton.addEventListener('click', submitVote);

    loadAllData();
});