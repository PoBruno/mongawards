const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/index.html';
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

// Containers
const resultadosContainer = document.getElementById('results-container');
const categoriasExistentesContainer = document.getElementById('existing-categories-container');
const indicadosExistentesContainer = document.getElementById('existing-nominees-container');

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
        alert(`Erro ao buscar resultados: ${error.message}`);
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
            `;
            categoriasExistentesContainer.appendChild(div);

            const checkbox = div.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', async (e) => {
                const categoriaId = e.target.dataset.categoryId;
                const isActive = e.target.checked;
                try {
                    await fetchData(`/categorias/${categoriaId}/status`, 'PUT', { is_active: isActive });
                    alert('Status da categoria atualizado com sucesso!');
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
            div.className = 'bg-white p-5 rounded shadow';
            div.innerHTML = `
                <h3 class="text-lg font-bold">${nom.nome} (ID: ${nom.id})</h3>
                ${nom.foto ? `<img src="${nom.foto}" alt="${nom.nome}" class="w-full h-32 object-cover my-2 rounded">` : ''}
            `;
            indicadosExistentesContainer.appendChild(div);
        });
    } catch (error) {
        alert(`Erro ao buscar indicados: ${error.message}`);
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
        alert(`Erro ao popular dropdowns: ${error.message}`);
    }
}

criarCategoriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('category-name').value;
    const descricao = document.getElementById('category-description').value;
    const bannerFile = document.getElementById('category-banner').files[0];

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    if (bannerFile) {
        formData.append('banner', bannerFile);
    }

    try {
        await fetchData('/categorias/', 'POST', formData, true);
        //alert('Categoria criada com sucesso!');
        console.log('Categoria criada com sucesso!');
        criarCategoriaForm.reset();
        getCategorias();
    } catch (error) {
        alert(`Erro ao criar categoria: ${error.message}`);
    }
});

criarIndicadoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nominee-name').value;
    const fotoFile = document.getElementById('nominee-photo').files[0];

    const formData = new FormData();
    formData.append('nome', nome);
    if (fotoFile) {
        formData.append('foto', fotoFile);
    }

    try {
        await fetchData('/indicados/', 'POST', formData, true);
        //alert('Indicado criado com sucesso!');
        console.log('Indicado criado com sucesso!');
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
        //alert('Indicado vinculado à categoria com sucesso!');
        console.log('Indicado vinculado à categoria com sucesso!');
        vincularIndicadoForm.reset();
    } catch (error) {
        alert(`Erro ao vincular indicado: ${error.message}`);
    }
});

// Initial load
showSection(resultadosSection);
getResults();
