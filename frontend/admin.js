document.addEventListener('DOMContentLoaded', () => {
    // Get references to sections and navigation links
    const resultadosSection = document.getElementById('results-section');
    const categoriasSection = document.getElementById('categories-section');
    const indicadosSection = document.getElementById('nominees-section');
    const vincularIndicadoSection = document.getElementById('link-nominee-section');

    const navResultados = document.getElementById('nav-results');
    const navCategorias = document.getElementById('nav-categories');
    const navIndicados = document.getElementById('nav-nominees');
    const navVincularIndicado = document.getElementById('nav-link-nominee');

    // Forms
    const criarCategoriaForm = document.getElementById('create-category-form');
    const criarIndicadoForm = document.getElementById('create-nominee-form');
    const vincularIndicadoForm = document.getElementById('link-nominee-form');

    // Containers
    const resultadosContainer = document.getElementById('results-container');
    const categoriasExistentesContainer = document.getElementById('existing-categories-container');
    const indicadosExistentesContainer = document.getElementById('existing-nominees-container');

    // Dropdowns for linking
    const selectIndicadoLink = document.getElementById('link-nominee-id');
    const selectCategoriaLink = document.getElementById('link-category-id');

    function showSection(section) {
        [resultadosSection, categoriasSection, indicadosSection, vincularIndicadoSection].forEach(s => s.classList.add('hidden'));
        section.classList.remove('hidden');
    }

    navResultados.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(resultadosSection);
        getResults();
    });

    navCategorias.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(categoriasSection);
        getCategorias();
    });

    navIndicados.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(indicadosSection);
        getIndicados();
    });

    navVincularIndicado.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(vincularIndicadoSection);
        populateDropdowns();
    });

    async function fetchData(url, method = 'GET', body = null, isFormData = false) {
        const options = {
            method,
            headers: {},
            credentials: 'include', // Include cookies in all requests
        };

        if (body) {
            if (isFormData) {
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        const response = await fetch(url, options);

        if (response.status === 401) {
            window.location.href = '/index.html'; // Redirect to login if not authenticated
            throw new Error('Not authenticated');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail);
        }

        // For methods that might not return JSON (e.g., DELETE)
        if (response.status === 204) { 
            return;
        }

        return response.json();
    }

    async function getResults() {
        try {
            const results = await fetchData('/results/');
            const categorias = await fetchData('/categorias/');
            const indicados = await fetchData('/indicados/');

            const categoriaMap = new Map(categorias.map(cat => [cat.id, cat.nome]));
            const indicadoMap = new Map(indicados.map(nom => [nom.id, nom.nome]));

            const resultsByCategoria = {};

            results.forEach(result => {
                if (!resultsByCategoria[result.categoria_id]) {
                    resultsByCategoria[result.categoria_id] = {};
                }
                resultsByCategoria[result.categoria_id][result.indicado_id] = (resultsByCategoria[result.categoria_id][result.indicado_id] || 0) + result.votos;
            });

            resultadosContainer.innerHTML = '';

            for (const categoria_id in resultsByCategoria) {
                const categoriaNome = categoriaMap.get(parseInt(categoria_id)) || `Categoria ${categoria_id}`;
                const div = document.createElement('div');
                div.className = 'bg-gray-800 p-5 rounded-lg shadow-lg mb-6';
                div.innerHTML = `<h2 class="text-2xl font-bold text-white mb-4">${categoriaNome}</h2>`;

                const ul = document.createElement('ul');
                ul.className = 'space-y-2';

                const sortedIndicados = Object.entries(resultsByCategoria[categoria_id]).sort(([, a], [, b]) => b - a);

                sortedIndicados.forEach(([indicado_id, votos]) => {
                    const indicadoNome = indicadoMap.get(parseInt(indicado_id)) || `Indicado ${indicado_id}`;
                    const li = document.createElement('li');
                    li.className = 'text-gray-300 flex justify-between items-center';
                    li.innerHTML = `<span>${indicadoNome}</span> <span class="font-semibold text-pink-400">${votos} votos</span>`;
                    ul.appendChild(li);
                });

                div.appendChild(ul);
                resultadosContainer.appendChild(div);
            }
        } catch (error) {
            alert(`Erro ao buscar resultados: ${error.message}`);
        }
    }

    async function getCategorias() {
        try {
            const categorias = await fetchData('/categorias/');
            categoriasExistentesContainer.innerHTML = '';
            categorias.forEach(cat => {
                const div = document.createElement('div');
                div.className = 'bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between';
                div.innerHTML = `
                    <div>
                        <h3 class="text-lg font-bold text-white">${cat.nome}</h3>
                        <p class="text-gray-400">${cat.descricao}</p>
                        ${cat.banner ? `<img src="${cat.banner}" alt="${cat.nome}" class="w-48 h-auto object-cover my-2 rounded-md">` : ''}
                    </div>
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" ${cat.is_active ? 'checked' : ''} data-category-id="${cat.id}">
                        <div class="relative w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-pink-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        <span class="ms-3 text-sm font-medium text-gray-300">Ativa</span>
                    </label>
                `;
                categoriasExistentesContainer.appendChild(div);

                const checkbox = div.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', async (e) => {
                    const categoriaId = e.target.dataset.categoryId;
                    const isActive = e.target.checked;
                    try {
                        await fetchData(`/categorias/${categoriaId}/status`, 'PUT', { is_active: isActive });
                        // No alert needed, visual feedback is enough
                    } catch (error) {
                        alert(`Erro ao atualizar status da categoria: ${error.message}`);
                        e.target.checked = !isActive; // Revert checkbox on error
                    }
                });
            });
        } catch (error) {
            alert(`Erro ao buscar categorias: ${error.message}`);
        }
    }

    async function getIndicados() {
        try {
            const indicados = await fetchData('/indicados/');
            indicadosExistentesContainer.innerHTML = '';
            indicados.forEach(nom => {
                const div = document.createElement('div');
                div.className = 'bg-gray-800 p-4 rounded-lg shadow-md flex items-center';
                div.innerHTML = `
                    ${nom.foto ? `<img src="${nom.foto}" alt="${nom.nome}" class="w-16 h-16 rounded-full object-cover mr-4 border-2 border-pink-500">` : '<div class="w-16 h-16 rounded-full bg-gray-700 mr-4"></div>'}
                    <h3 class="text-lg font-bold text-white">${nom.nome}</h3>
                `;
                indicadosExistentesContainer.appendChild(div);
            });
        } catch (error) {
            alert(`Erro ao buscar indicados: ${error.message}`);
        }
    }

    async function populateDropdowns() {
        try {
            const [categorias, indicados] = await Promise.all([fetchData('/categorias/'), fetchData('/indicados/')]);

            selectCategoriaLink.innerHTML = '<option value="">Selecione uma Categoria</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                selectCategoriaLink.appendChild(option);
            });

            selectIndicadoLink.innerHTML = '<option value="">Selecione um Indicado</option>';
            indicados.forEach(nom => {
                const option = document.createElement('option');
                option.value = nom.id;
                option.textContent = nom.nome;
                selectIndicadoLink.appendChild(option);
            });

        } catch (error) {
            alert(`Erro ao popular dropdowns: ${error.message}`);
        }
    }

    criarCategoriaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(criarCategoriaForm);
        try {
            await fetchData('/categorias/', 'POST', formData, true);
            criarCategoriaForm.reset();
            getCategorias();
        } catch (error) {
            alert(`Erro ao criar categoria: ${error.message}`);
        }
    });

    criarIndicadoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(criarIndicadoForm);
        try {
            await fetchData('/indicados/', 'POST', formData, true);
            criarIndicadoForm.reset();
            getIndicados();
        } catch (error) {
            alert(`Erro ao criar indicado: ${error.message}`);
        }
    });

    vincularIndicadoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const indicado_id = parseInt(selectIndicadoLink.value);
        const categoria_id = parseInt(selectCategoriaLink.value);

        if (!indicado_id || !categoria_id) {
            alert('Por favor, selecione um Indicado e uma Categoria.');
            return;
        }

        try {
            await fetchData('/indicados_categorias/', 'POST', { indicado_id, categoria_id });
            vincularIndicadoForm.reset();
            alert('Indicado vinculado com sucesso!');
        } catch (error) {
            alert(`Erro ao vincular indicado: ${error.message}`);
        }
    });

    // Initial load
    showSection(resultadosSection);
    getResults();
});
