const token = localStorage.getItem('token');
const isAdmin = localStorage.getItem('is_admin') === 'true';

if (!token) {
    window.location.href = '/index.html';
} else if (!isAdmin) {
    window.location.href = '/dashboard.html';
}

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

// Form elements for Category
const categoryNameInput = document.getElementById('category-name');
const categoryDescriptionInput = document.getElementById('category-description');
const categoryBannerInput = document.getElementById('category-banner');
const createCategoryButton = criarCategoriaForm.querySelector('button[type="submit"]');
let editingCategoryId = null;

// Form elements for Nominee
const nomineeNameInput = document.getElementById('nominee-name');
const nomineePhotoInput = document.getElementById('nominee-photo');
const createNomineeButton = criarIndicadoForm.querySelector('button[type="submit"]');
let editingNomineeId = null;

// Containers
const resultadosContainer = document.getElementById('results-container');
const categoriasExistentesContainer = document.getElementById('existing-categories-container');
const indicadosExistentesContainer = document.getElementById('existing-nominees-container');
const vinculosExistentesContainer = document.getElementById('existing-links-container'); // New container for links

// Dropdowns for linking
const selectIndicadoLink = document.getElementById('link-nominee-id');
const selectCategoriaLink = document.getElementById('link-category-id');

function showSection(section) {
    resultadosSection.classList.add('hidden');
    categoriasSection.classList.add('hidden');
    indicadosSection.classList.add('hidden');
    vincularIndicadoSection.classList.add('hidden');
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
    getExistingLinks(); // Fetch and display existing links
});

async function fetchData(url, method = 'GET', body = null, isFormData = false) {
    const headers = {
        'Authorization': `Bearer ${token}`,
    };

    const options = {
        method,
        headers: headers,
        body: body,
    };

    if (!isFormData) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    } else {
        // When sending FormData, let the browser set the Content-Type header
        delete options.headers['Content-Type'];
    }

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

async function getResults() {
    try {
        const results = await fetchData('/results/');
        const categorias = await fetchData('/categorias/');
        const indicados = await fetchData('/indicados/');

        const categoriaMap = new Map(categorias.map(cat => [cat.id, cat.nome]));
        const indicadoMap = new Map(indicados.map(nom => [nom.id, nom.nome]));

        const resultsByCategoria = {};

        for (const result of results) {
            if (!resultsByCategoria[result.categoria_id]) {
                resultsByCategoria[result.categoria_id] = {};
            }
            if (!resultsByCategoria[result.categoria_id][result.indicado_id]) {
                resultsByCategoria[result.categoria_id][result.indicado_id] = 0;
            }
            resultsByCategoria[result.categoria_id][result.indicado_id]++;
        }

        resultadosContainer.innerHTML = '';

        for (const categoria_id in resultsByCategoria) {
            const categoriaNome = categoriaMap.get(parseInt(categoria_id)) || `Categoria ${categoria_id}`;
            const div = document.createElement('div');
            div.className = 'bg-white p-5 rounded shadow mb-4';
            div.innerHTML = `<h2 class="text-xl font-bold">${categoriaNome}</h2>`;

            const ul = document.createElement('ul');
            for (const indicado_id in resultsByCategoria[categoria_id]) {
                const indicadoNome = indicadoMap.get(parseInt(indicado_id)) || `Indicado ${indicado_id}`;
                const li = document.createElement('li');
                li.textContent = `${indicadoNome}: ${resultsByCategoria[categoria_id][indicado_id]} votos`;
                ul.appendChild(li);
            }

            div.appendChild(ul);
            resultadosContainer.appendChild(div);
        }
    } catch (error) {
        console.error(`Erro ao buscar resultados: ${error.message}`);
    }
}

async function getCategorias() {
    try {
        const categorias = await fetchData('/categorias/');
        categoriasExistentesContainer.innerHTML = '';
        categorias.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'bg-white p-5 rounded shadow';
            div.innerHTML = `
                <h3 class="text-lg font-bold">${cat.nome} (ID: ${cat.id})</h3>
                <p>${cat.descricao}</p>
                ${cat.banner ? `<img src="${cat.banner}" alt="${cat.nome}" class="w-full h-32 object-cover my-2 rounded">` : ''}
                <label class="inline-flex items-center mt-3">
                    <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600" ${cat.is_active ? 'checked' : ''} data-category-id="${cat.id}">
                    <span class="ml-2 text-gray-700">Ativa para Votação</span>
                </label>
                <div class="mt-4 flex space-x-2">
                    <button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded edit-category-btn" data-id="${cat.id}">Editar</button>
                    <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded delete-category-btn" data-id="${cat.id}">Excluir</button>
                </div>
            `;
            categoriasExistentesContainer.appendChild(div);

            const checkbox = div.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', async (e) => {
                const categoriaId = e.target.dataset.categoryId;
                const isActive = e.target.checked;
                try {
                    await fetchData(`/categorias/${categoriaId}/status`, 'PUT', { is_active: isActive });
                    console.log('Status da categoria atualizado com sucesso!');
                } catch (error) {
                    console.error(`Erro ao atualizar status da categoria: ${error.message}`);
                    e.target.checked = !isActive; // Revert checkbox on error
                }
            });
        });

        document.querySelectorAll('.edit-category-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const categoryId = e.target.dataset.id;
                try {
                    const category = await fetchData(`/categorias/${categoryId}`);
                    categoryNameInput.value = category.nome;
                    categoryDescriptionInput.value = category.descricao;
                    // categoryBannerInput.value = ''; // Clear file input
                    editingCategoryId = category.id;
                    createCategoryButton.textContent = 'Atualizar Categoria';
                    criarCategoriaForm.querySelector('h2').textContent = 'Editar Categoria';
                    // Add a cancel button if not already there
                    if (!document.getElementById('cancel-category-edit')) {
                        const cancelButton = document.createElement('button');
                        cancelButton.id = 'cancel-category-edit';
                        cancelButton.className = 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2';
                        cancelButton.textContent = 'Cancelar Edição';
                        cancelButton.type = 'button';
                        cancelButton.addEventListener('click', resetCategoryForm);
                        createCategoryButton.parentNode.appendChild(cancelButton);
                    }
                } catch (error) {
                    console.error(`Erro ao carregar categoria para edição: ${error.message}`);
                }
            });
        });

        document.querySelectorAll('.delete-category-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const categoryId = e.target.dataset.id;
                if (confirm('Tem certeza que deseja excluir esta categoria? Isso também removerá todos os vínculos de indicados a ela.')) {
                    try {
                        await fetchData(`/categorias/${categoryId}`, 'DELETE');
                        console.log('Categoria excluída com sucesso!');
                        getCategorias();
                    } catch (error) {
                        console.error(`Erro ao excluir categoria: ${error.message}`);
                    }
                }
            });
        });

    } catch (error) {
        console.error(`Erro ao buscar categorias: ${error.message}`);
    }
}

function resetCategoryForm() {
    criarCategoriaForm.reset();
    editingCategoryId = null;
    createCategoryButton.textContent = 'Criar Categoria';
    criarCategoriaForm.querySelector('h2').textContent = 'Criar Nova Categoria';
    const cancelButton = document.getElementById('cancel-category-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
}

async function getIndicados() {
    try {
        const indicados = await fetchData('/indicados/');
        indicadosExistentesContainer.innerHTML = '';
        indicados.forEach(nom => {
            const div = document.createElement('div');
            div.className = 'bg-white p-5 rounded shadow';
            div.innerHTML = `
                <h3 class="text-lg font-bold">${nom.nome} (ID: ${nom.id})</h3>
                ${nom.foto ? `<img src="${nom.foto}" alt="${nom.nome}" class="w-full h-32 object-cover my-2 rounded">` : ''}
                <div class="mt-4 flex space-x-2">
                    <button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded edit-nominee-btn" data-id="${nom.id}">Editar</button>
                    <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded delete-nominee-btn" data-id="${nom.id}">Excluir</button>
                </div>
            `;
            indicadosExistentesContainer.appendChild(div);
        });

        document.querySelectorAll('.edit-nominee-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const nomineeId = e.target.dataset.id;
                try {
                    const nominee = await fetchData(`/indicados/${nomineeId}`);
                    nomineeNameInput.value = nominee.nome;
                    // nomineePhotoInput.value = ''; // Clear file input
                    editingNomineeId = nominee.id;
                    createNomineeButton.textContent = 'Atualizar Indicado';
                    criarIndicadoForm.querySelector('h2').textContent = 'Editar Indicado';
                    // Add a cancel button if not already there
                    if (!document.getElementById('cancel-nominee-edit')) {
                        const cancelButton = document.createElement('button');
                        cancelButton.id = 'cancel-nominee-edit';
                        cancelButton.className = 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2';
                        cancelButton.textContent = 'Cancelar Edição';
                        cancelButton.type = 'button';
                        cancelButton.addEventListener('click', resetNomineeForm);
                        createNomineeButton.parentNode.appendChild(cancelButton);
                    }
                } catch (error) {
                    console.error(`Erro ao carregar indicado para edição: ${error.message}`);
                }
            });
        });

        document.querySelectorAll('.delete-nominee-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const nomineeId = e.target.dataset.id;
                if (confirm('Tem certeza que deseja excluir este indicado? Isso também removerá todos os vínculos de categorias a ele.')) {
                    try {
                        await fetchData(`/indicados/${nomineeId}`, 'DELETE');
                        console.log('Indicado excluído com sucesso!');
                        getIndicados();
                    } catch (error) {
                        console.error(`Erro ao excluir indicado: ${error.message}`);
                    }
                }
            });
        });

    } catch (error) {
        console.error(`Erro ao buscar indicados: ${error.message}`);
    }
}

function resetNomineeForm() {
    criarIndicadoForm.reset();
    editingNomineeId = null;
    createNomineeButton.textContent = 'Criar Indicado';
    criarIndicadoForm.querySelector('h2').textContent = 'Criar Novo Indicado';
    const cancelButton = document.getElementById('cancel-nominee-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
}

async function populateDropdowns() {
    try {
        const categorias = await fetchData('/categorias/');
        const indicados = await fetchData('/indicados/');

        selectCategoriaLink.innerHTML = '<option value="">Selecione uma Categoria</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = `${cat.nome} (ID: ${cat.id})`;
            selectCategoriaLink.appendChild(option);
        });

        selectIndicadoLink.innerHTML = '<option value="">Selecione um Indicado</option>';
        indicados.forEach(nom => {
            const option = document.createElement('option');
            option.value = nom.id;
            option.textContent = `${nom.nome} (ID: ${nom.id})`;
            selectIndicadoLink.appendChild(option);
        });

    } catch (error) {
        console.error(`Erro ao popular dropdowns: ${error.message}`);
    }
}

async function getExistingLinks() {
    try {
        const links = await fetchData('/indicados_categorias/');
        const categorias = await fetchData('/categorias/');
        const indicados = await fetchData('/indicados/');

        const categoriaMap = new Map(categorias.map(cat => [cat.id, cat.nome]));
        const indicadoMap = new Map(indicados.map(nom => [nom.id, nom.nome]));

        vinculosExistentesContainer.innerHTML = '';
        if (links.length === 0) {
            vinculosExistentesContainer.innerHTML = '<p class="text-gray-600">Nenhum vínculo existente.</p>';
            return;
        }

        links.forEach(link => {
            const categoriaNome = categoriaMap.get(link.categoria_id) || `Categoria ${link.categoria_id}`;
            const indicadoNome = indicadoMap.get(link.indicado_id) || `Indicado ${link.indicado_id}`;

            const div = document.createElement('div');
            div.className = 'bg-white p-3 rounded shadow flex justify-between items-center mb-2';
            div.innerHTML = `
                <span>${indicadoNome} vinculado a ${categoriaNome} (ID do Vínculo: ${link.id})</span>
                <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded delete-link-btn" data-id="${link.id}">Excluir</button>
            `;
            vinculosExistentesContainer.appendChild(div);
        });

        document.querySelectorAll('.delete-link-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const linkId = e.target.dataset.id;
                if (confirm('Tem certeza que deseja excluir este vínculo?')) {
                    try {
                        await fetchData(`/indicados_categorias/${linkId}`, 'DELETE');
                        console.log('Vínculo excluído com sucesso!');
                        getExistingLinks();
                    } catch (error) {
                        console.error(`Erro ao excluir vínculo: ${error.message}`);
                    }
                }
            });
        });

    } catch (error) {
        console.error(`Erro ao buscar vínculos existentes: ${error.message}`);
    }
}

criarCategoriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = categoryNameInput.value;
    const descricao = categoryDescriptionInput.value;
    const bannerFile = categoryBannerInput.files[0];

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    if (bannerFile) {
        formData.append('banner', bannerFile);
    }

    try {
        if (editingCategoryId) {
            await fetchData(`/categorias/${editingCategoryId}`, 'PUT', formData, true);
            console.log('Categoria atualizada com sucesso!');
        } else {
            await fetchData('/categorias/', 'POST', formData, true);
            console.log('Categoria criada com sucesso!');
        }
        resetCategoryForm();
        getCategorias();
    } catch (error) {
        console.error(`Erro ao salvar categoria: ${error.message}`);
    }
});

criarIndicadoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = nomineeNameInput.value;
    const fotoFile = nomineePhotoInput.files[0];

    const formData = new FormData();
    formData.append('nome', nome);
    if (fotoFile) {
        formData.append('foto', fotoFile);
    }

    try {
        if (editingNomineeId) {
            await fetchData(`/indicados/${editingNomineeId}`, 'PUT', formData, true);
            console.log('Indicado atualizado com sucesso!');
        } else {
            await fetchData('/indicados/', 'POST', formData, true);
            console.log('Indicado criado com sucesso!');
        }
        resetNomineeForm();
        getIndicados();
    } catch (error) {
        console.error(`Erro ao salvar indicado: ${error.message}`);
    }
});

vincularIndicadoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const indicado_id = parseInt(selectIndicadoLink.value);
    const categoria_id = parseInt(selectCategoriaLink.value);

    if (!indicado_id || !categoria_id) {
        console.warn('Por favor, selecione um Indicado e uma Categoria.');
        return;
    }

    try {
        await fetchData('/indicados_categorias/', 'POST', { indicado_id, categoria_id });
        console.log('Indicado vinculado à categoria com sucesso!');
        vincularIndicadoForm.reset();
        getExistingLinks();
    } catch (error) {
        console.error(`Erro ao vincular indicado: ${error.message}`);
    }
});

// Initial load
showSection(resultadosSection);
getResults();