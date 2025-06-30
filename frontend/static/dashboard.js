const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/index.html';
}

// DOM Elements
const categoryDisplay = document.getElementById('category-display');
const categoryBannerContainer = document.getElementById('category-banner-container');
const categoryName = document.getElementById('category-name');
const categoryDescription = document.getElementById('category-description');
const nomineesList = document.getElementById('nominees-list');
const prevCategoryBtn = document.getElementById('prev-category');
const nextCategoryBtn = document.getElementById('next-category');
const voteButton = document.getElementById('vote-button');
const votedMessage = document.getElementById('voted-message');

// Global State
let allCategories = [];
let allNominees = [];
let allIndicadosCategorias = [];
let userVotedCategories = [];
let currentCategoryIndex = 0;

async function fetchData(url, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const options = {
        method,
        headers,
        body: JSON.stringify(body),
    };

    if (method === 'GET') {
        delete options.body;
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Something went wrong');
    }
    return response.json();
}

async function loadAllData() {
    try {
        allCategories = await fetchData('/categorias/');
        allNominees = await fetchData('/indicados/');
        allIndicadosCategorias = await fetchData('/indicados_categorias/');
        // Assuming an endpoint to get user's votes for categories
        // For now, we'll simulate or add a new endpoint later if needed
        // userVotedCategories = await fetchData('/votos_usuario/'); // Need to implement this endpoint

        // Filter out inactive categories for regular users
        allCategories = allCategories.filter(cat => cat.is_active);

        if (allCategories.length > 0) {
            renderCategory(currentCategoryIndex);
        } else {
            categoryDisplay.innerHTML = '<p class="text-center text-gray-500 text-xl p-10">Nenhuma categoria disponível para votação no momento.</p>';
            prevCategoryBtn.disabled = true;
            nextCategoryBtn.disabled = true;
            voteButton.disabled = true;
        }
    } catch (error) {
        alert(`Erro ao carregar dados: ${error.message}`);
    }
}

function renderCategory(index) {
    if (index < 0 || index >= allCategories.length) return;

    currentCategoryIndex = index;
    const category = allCategories[currentCategoryIndex];

    // Render banner
    if (category.banner) {
        categoryBannerContainer.innerHTML = `<img src="${category.banner}" alt="${category.nome}" class="w-full h-full object-cover">`;
    } else {
        categoryBannerContainer.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">Sem Banner</div>';
    }

    categoryName.textContent = category.nome;
    categoryDescription.textContent = category.descricao;

    // Render nominees
    nomineesList.innerHTML = '';
    const nomineesForCategory = allIndicadosCategorias.filter(link => link.categoria_id === category.id)
        .map(link => allNominees.find(nom => nom.id === link.indicado_id))
        .filter(nom => nom !== undefined);

    nomineesForCategory.forEach(nominee => {
        const div = document.createElement('div');
        div.className = 'flex items-center p-4 border border-gray-200 rounded-lg shadow-sm';
        div.innerHTML = `
            <input type="radio" id="nominee-${nominee.id}" name="selected_nominee" value="${nominee.id}" class="form-radio h-5 w-5 text-blue-600">
            <label for="nominee-${nominee.id}" class="ml-3 text-lg font-medium text-gray-700 flex items-center">
                ${nominee.foto ? `<img src="${nominee.foto}" alt="${nominee.nome}" class="w-12 h-12 rounded-full mr-3 object-cover">` : ''}
                ${nominee.nome}
            </label>
        `;
        nomineesList.appendChild(div);
    });

    // Check if user already voted in this category
    const hasVoted = userVotedCategories.includes(category.id); // This needs to be populated from backend
    if (hasVoted) {
        votedMessage.classList.remove('hidden');
        voteButton.disabled = true;
        nomineesList.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);
    } else {
        votedMessage.classList.add('hidden');
        voteButton.disabled = false;
        nomineesList.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = false);
    }

    // Update navigation buttons state
    prevCategoryBtn.disabled = currentCategoryIndex === 0;
    nextCategoryBtn.disabled = currentCategoryIndex === allCategories.length - 1;
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
        alert('Voto registrado com sucesso!');
        userVotedCategories.push(categoriaId); // Add to local state
        renderCategory(currentCategoryIndex); // Re-render to disable voting
    } catch (error) {
        alert(`Erro ao registrar voto: ${error.message}`);
    }
}

// Event Listeners
prevCategoryBtn.addEventListener('click', () => renderCategory(currentCategoryIndex - 1));
nextCategoryBtn.addEventListener('click', () => renderCategory(currentCategoryIndex + 1));
voteButton.addEventListener('click', submitVote);

// Initial Load
loadAllData();