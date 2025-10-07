document.addEventListener('DOMContentLoaded', function () {
    const manageUsersLink = document.querySelector('a[href="#manage-users"]');
    const registerCustomerLink = document.querySelector('a[href="#register-customer"]');
    const mainContent = document.querySelector('main .container');
    let usersData = {}


    if (manageUsersLink && registerCustomerLink && mainContent) {
        const backendUrl = window.BACKEND_URL;
        const token = window.AUTH_TOKEN;


        function loadManageUsers() {
            fetch(backendUrl + '/user/all', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
                .then(response => response.json())
                .then(users => {
                    let userListHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h1>Gerenciar Usuários</h1>
                                            <p>Aqui você pode gerenciar os usuários do sistema.</p>
                                        </div>
                                        <button class="btn btn-success" id="addUserButton" onclick="openAddUserModal()">
                                            <i class="bi bi-plus"></i> Adicionar Usuário
                                        </button>
                                    </div>
                                    
                                    <div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
                                        <div class="modal-dialog modal-dialog-centered">
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h5 class="modal-title" id="addUserModalLabel">Adicionar Usuário</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                 <div class="modal-body">
                                                    <div class="mb-3">
                                                        <label for="nome" class="form-label">Nome</label>
                                                        <input type="text" class="form-control" id="nome" placeholder="Digite o nome">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label for="email" class="form-label">Email</label>
                                                        <input type="email" class="form-control" id="email" placeholder="Digite o email">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label for="senha" class="form-label">Senha</label>
                                                        <input type="password" class="form-control" id="senha" placeholder="Digite a senha">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Clientes</label>
                                                        <div id="customerList">
                                                            {/* Lista de clientes será carregada aqui */}
                                                        </div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <div id="permissions">
                                                            {/* Permissões serão carregadas aqui */}
                                                        </div>
                                                    </div>
                                                </div>
                                                 <div class="modal-footer">
                                                    <button type="button" class="btn btn-primary" id="saveUserButton">Salvar</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
                                        <div class="modal-dialog modal-dialog-centered">
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h5 class="modal-title" id="editUserModalLabel">Editar Usuário</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                 <div class="modal-body">
                                                    <div class="mb-3">
                                                        <label for="nome" class="form-label">Nome</label>
                                                        <input type="text" class="form-control" id="nomeEdit" placeholder="Digite o nome">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label for="email" class="form-label">Email</label>
                                                        <input type="email" class="form-control" id="emailEdit" placeholder="Digite o email">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label for="senha" class="form-label">Senha</label>
                                                        <input type="password" class="form-control" id="senhaEdit" placeholder="Digite a senha">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Clientes</label>
                                                        <div id="customerListEdit">
                                                        </div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <div id="permissionsEdit">
                                                        </div>
                                                    </div>
                                                </div>
                                                 <div class="modal-footer">
                                                    <button type="button" class="btn btn-primary" id="saveUserButtonEdit">Salvar</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="modal fade" id="deleteUserModal" tabindex="-1" aria-labelledby="deleteUserModalLabel" aria-hidden="true">
                                        <div class="modal-dialog modal-dialog-centered">
                                            <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="deleteUserModalLabel">Confirmar Deleção</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                            </div>
                                            <div class="modal-body">
                                                <p>Deseja realmente deletar o usuário <strong id="userEmailToDelete"></strong>?</p>
                                            </div>
                                            <div class="modal-footer">
                                                <button type="button" class="btn btn-danger" id="confirmDeleteUser">Sim</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Não</button>
                                            </div>
                                            </div>
                                        </div>
                                    </div>


                                    <div class="container">`;

                    document.querySelector('main .container').innerHTML = userListHTML;
                    usersData = users
                    users.forEach(user => {
                        const statusColor = user.status === 'active' ? 'green' : 'gray';
                        userListHTML += `
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-3">
                                        <h5 class="card-title">${user.name}</h5>
                                    </div>
                                    <div class="col-md-3">
                                        <p class="card-text">${user.email}</p>
                                    </div>
                                    <div class="col-md-2 d-flex align-items-center justify-content-center">
                                        <i class="bi bi-circle-fill" style="font-size: 1.0em; color: ${statusColor}; cursor: pointer;" title="${user.status === 'active' ? 'Ativo' : 'Inativo'}"></i>
                                    </div>
                                    <div class="col-md-4 text-end">
                                        <a href="#" class="btn btn-primary btn-sm" onclick="openEditUserModal('${user._id}')"><i class="bi bi-pencil"></i> Editar</a>
                                        <a href="#" class="btn btn-danger btn-sm" onclick="openDeleteUserModal('${user.email}','${user._id}')"><i class="bi bi-trash"></i> Excluir</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    });
                    userListHTML += '</div>';
                    mainContent.innerHTML = userListHTML;


                })
                .catch(error => {
                    console.error('Erro ao buscar usuários:', error);
                    mainContent.innerHTML = '<h1>Gerenciar Usuários</h1><p>Erro ao buscar usuários.</p>';
                });
        }

        // Carrega o conteúdo de "Manage Users" inicialmente
        loadManageUsers();

        manageUsersLink.addEventListener('click', function (event) {
            event.preventDefault();
            loadManageUsers();
        });

        registerCustomerLink.addEventListener('click', function (event) {
            event.preventDefault();
            loadCustomersPage()

        });
    } else {
        console.error('Um ou mais elementos não foram encontrados.');
    }

    function loadCustomers(htmlId) {
        const backendUrl = window.BACKEND_URL;
        const token = window.AUTH_TOKEN;
        const customerList = document.getElementById(htmlId);

        // Limpa a lista de clientes
        customerList.innerHTML = '';

        // Define o número máximo de linhas
        const maxRows = 4;

        // Cria a tabela
        const table = document.createElement('table');
        table.classList.add('table', 'table-borderless');

        // Cria o cabeçalho da tabela
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');


        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Cria o corpo da tabela
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        // Cria as linhas fixas
        const rows = [];
        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement('tr');
            tbody.appendChild(row);
            rows.push(row);
        }
        return new Promise(resolve => {
            setTimeout(() => {
                fetch(backendUrl + '/api/all/customers', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                    .then(response => response.json())
                    .then(customers => {
                        let colCount = 0;
                        customers.forEach((customer, index) => {
                            const rowIndex = index % maxRows;
                            const row = rows[rowIndex];

                            // Cria a célula da tabela
                            const cell = document.createElement('td');

                            // Cria o checkbox
                            const div = document.createElement('div');
                            div.classList.add('form-check');

                            const input = document.createElement('input');
                            input.classList.add('form-check-input');
                            input.type = 'checkbox';
                            input.value = customer._id;
                            input.id = `customer_${customer._id}`;

                            const label = document.createElement('label');
                            label.classList.add('form-check-label');
                            label.htmlFor = `customer_${customer._id}`;
                            label.textContent = customer.customer_name;

                            div.appendChild(input);
                            div.appendChild(label);
                            cell.appendChild(div);

                            row.appendChild(cell);
                            colCount++;
                        });

                        customerList.appendChild(table);
                    })
                    .catch(error => {
                        console.error('Erro ao buscar clientes:', error);
                        customerList.innerHTML = '<p>Erro ao buscar clientes.</p>';
                    });
                resolve();
            }, 500); // simula tempo de carregamento
        });
    }

    function loadPermissions(permissionsData, htmlId) {


        const permissionsList = document.getElementById(htmlId);
        permissionsList.innerHTML = '';

        // Cria a tabela
        const table = document.createElement('table');
        table.classList.add('table', 'table-borderless');

        // Cria o corpo da tabela
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        // Cria o cabeçalho
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        // Lista dos títulos das colunas
        const headers = ['', 'Criar', 'Editar', 'Excluir', 'Visualizar'];

        headers.forEach(title => {
            const th = document.createElement('th');
            th.textContent = title;
            th.classList.add('text-center');
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Cria as linhas
        for (const permissionType in permissionsData) {
            const permissionGroup = permissionsData[permissionType];

            const row = document.createElement('tr');

            // Adiciona o nome da permissão
            const permissionNameCell = document.createElement('td');
            let permissionTypeFriendlyName = "";
            switch (permissionType) {
                case "platform_permission":
                    permissionTypeFriendlyName = "Permissões da Plataforma";
                    break;
                case "users_permission":
                    permissionTypeFriendlyName = "Permissões de Usuários";
                    break;
                case "customers_permission":
                    permissionTypeFriendlyName = "Permissões de Clientes";
                    break;
                default:
                    permissionTypeFriendlyName = permissionType;
            }
            permissionNameCell.textContent = permissionTypeFriendlyName;
            row.appendChild(permissionNameCell);

            // Adiciona os checkboxes
            for (const permission in permissionGroup) {
                const permissionValue = permissionGroup[permission];

                const cell = document.createElement('td');
                cell.classList.add('text-center', 'align-middle');

                const div = document.createElement('div');
                div.classList.add('form-check', 'justify-content-center');

                const input = document.createElement('input');
                input.classList.add('form-check-input');
                input.type = 'checkbox';
                input.value = permission;
                input.id = `${permissionType}_${permission}`;
                input.checked = permissionValue;

                const label = document.createElement('label');
                label.classList.add('form-check-label');
                let permissionFriendlyName = "";
                switch (permission) {
                    case "create":
                        permissionFriendlyName = "Criar";
                        break;
                    case "edit":
                        permissionFriendlyName = "Editar";
                        break;
                    case "delete":
                        permissionFriendlyName = "Excluir";
                        break;
                    case "view":
                        permissionFriendlyName = "Visualizar";
                        break;
                    default:
                        permissionFriendlyName = permission;
                }
                label.htmlFor = `${permissionType}_${permission}`;
                label.textContent = permissionFriendlyName;

                div.appendChild(input);
                cell.appendChild(div);
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        }

        // Adiciona o cabeçalho
        permissionsList.appendChild(table);
    }

    window.openEditUserModal = async function (userId) {
        const user = usersData.find(user => user._id === userId)
        const backendUrl = window.BACKEND_URL;
        const token = window.AUTH_TOKEN;
        const editUserModal = document.getElementById('editUserModal');
        // Usa o Bootstrap Modal
        const modal = new bootstrap.Modal(editUserModal);
        modal.show();

        // Limpa campos e estados anteriores
        document.getElementById('nomeEdit').value = user.name;
        document.getElementById('emailEdit').value = user.email;
        document.getElementById('senhaEdit').value = '';

        const orderedPermissions = {
            platform_permission: {
                create: user.permissions.platform_permission?.create ?? false,
                edit: user.permissions.platform_permission?.edit ?? false,
                delete: user.permissions.platform_permission?.delete ?? false,
                view: user.permissions.platform_permission?.view ?? false
            },
            users_permission: {
                create: user.permissions.users_permission?.create ?? false,
                edit: user.permissions.users_permission?.edit ?? false,
                delete: user.permissions.users_permission?.delete ?? false,
                view: user.permissions.users_permission?.view ?? false
            },
            customers_permission: {
                create: user.permissions.customers_permission?.create ?? false,
                edit: user.permissions.customers_permission?.edit ?? false,
                delete: user.permissions.customers_permission?.delete ?? false,
                view: user.permissions.customers_permission?.view ?? false
            }
        }

        loadPermissions(orderedPermissions, "permissionsEdit");
        await loadCustomers("customerListEdit")

        for (const id of user.customers) {
            try {
                const checkbox = await waitForElement("customer_" + id);
                checkbox.checked = true;
            } catch (err) {
                console.warn(err);
            }
        }

        function waitForElement(id, timeout = 3000) {
            return new Promise((resolve, reject) => {
                const intervalTime = 50;
                let timePassed = 0;

                const interval = setInterval(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        clearInterval(interval);
                        resolve(el);
                    }
                    timePassed += intervalTime;
                    if (timePassed >= timeout) {
                        clearInterval(interval);
                        reject("Elemento não encontrado dentro do tempo limite: " + id);
                    }
                }, intervalTime);
            });
        }

        const saveUserButtonEdit = document.getElementById('saveUserButtonEdit');
        if (saveUserButtonEdit) {
            saveUserButtonEdit.onclick = function () {
                const nome = document.getElementById('nomeEdit').value;
                const email = document.getElementById('emailEdit').value;
                //const senha = document.getElementById('senhaEdit').value;

                const customerCheckboxes = document.querySelectorAll('#customerListEdit input[type="checkbox"]:checked');
                const customers = Array.from(customerCheckboxes).map(cb => cb.value);

                const permissions = {
                    platform_permission: {
                        create: document.getElementById('platform_permission_create').checked,
                        edit: document.getElementById('platform_permission_edit').checked,
                        delete: document.getElementById('platform_permission_delete').checked,
                        view: document.getElementById('platform_permission_view').checked
                    },
                    users_permission: {
                        create: document.getElementById('users_permission_create').checked,
                        edit: document.getElementById('users_permission_edit').checked,
                        delete: document.getElementById('users_permission_delete').checked,
                        view: document.getElementById('users_permission_view').checked
                    },
                    customers_permission: {
                        create: document.getElementById('customers_permission_create').checked,
                        edit: document.getElementById('customers_permission_edit').checked,
                        delete: document.getElementById('customers_permission_delete').checked,
                        view: document.getElementById('customers_permission_view').checked
                    }
                };

                const userData = {
                    _id: userId,
                    name: nome,
                    email: email,
                    customers: customers,
                    permissions: permissions
                };

                fetch(backendUrl + '/user/edit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(userData)
                })
                    .then(response => {
                        response.clone().text().then(text => {
                            alert(`Resposta: ${text}\nCódigo: ${response.status}`);
                            if (response.status === 200) {
                                loadManageUsers();
                                modal.hide();
                            }
                        });
                    })
                    .catch(error => {
                        alert(`Erro: ${error}`);
                    });
            };
        }
    }

    window.openAddUserModal = function () {
        const backendUrl = window.BACKEND_URL;
        const token = window.AUTH_TOKEN;
        const addUserModal = document.getElementById('addUserModal');

        // Usa o Bootstrap Modal
        const modal = new bootstrap.Modal(addUserModal);
        modal.show();

        // Limpa campos e estados anteriores
        document.getElementById('nome').value = '';
        document.getElementById('email').value = '';
        document.getElementById('senha').value = '';
        document.getElementById('customerList').innerHTML = '';

        const permissionsData = {
            "platform_permission": {
                "create": false,
                "edit": false,
                "delete": false,
                "view": false
            },
            "users_permission": {
                "create": false,
                "edit": false,
                "delete": false,
                "view": false
            },
            "customers_permission": {
                "create": false,
                "edit": false,
                "delete": false,
                "view": true
            }
        };
        // Carrega dados necessários
        loadCustomers("customerList");
        loadPermissions(permissionsData, "permissions");

        // Configura o botão de salvar
        const saveUserButton = document.getElementById('saveUserButton');
        if (saveUserButton) {
            saveUserButton.onclick = function () {
                const nome = document.getElementById('nome').value;
                const email = document.getElementById('email').value;
                const senha = document.getElementById('senha').value;

                const customerCheckboxes = document.querySelectorAll('#customerList input[type="checkbox"]:checked');
                const customers = Array.from(customerCheckboxes).map(cb => cb.value);

                const permissions = {
                    platform_permission: {
                        create: document.getElementById('platform_permission_create').checked,
                        edit: document.getElementById('platform_permission_edit').checked,
                        delete: document.getElementById('platform_permission_delete').checked
                    },
                    users_permission: {
                        create: document.getElementById('users_permission_create').checked,
                        edit: document.getElementById('users_permission_edit').checked,
                        delete: document.getElementById('users_permission_delete').checked,
                        view: document.getElementById('users_permission_view').checked
                    },
                    customers_permission: {
                        create: document.getElementById('customers_permission_create').checked,
                        edit: document.getElementById('customers_permission_edit').checked,
                        delete: document.getElementById('customers_permission_delete').checked,
                        view: document.getElementById('customers_permission_view').checked
                    }
                };

                const userData = {
                    name: nome,
                    email: email,
                    password: senha,
                    customers: customers,
                    permissions: permissions
                };

                fetch(backendUrl + '/user/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(userData)
                })
                    .then(response => {
                        response.clone().text().then(text => {
                            alert(`Resposta: ${text}\nCódigo: ${response.status}`);
                            if (response.status === 200) {
                                loadManageUsers();
                                modal.hide();
                            }
                        });
                    })
                    .catch(error => {
                        alert(`Erro: ${error}`);
                    });
            };
        }

        // Configura botões de fechar
        const closeButton = addUserModal.querySelector('.btn-close');
        const cancelButton = addUserModal.querySelector('.btn-secondary');
        if (closeButton) closeButton.onclick = () => modal.hide();
        if (cancelButton) cancelButton.onclick = () => modal.hide();
    };

    window.openDeleteUserModal = function (userEmail, userId) {
        const deleteUserModal = document.getElementById('deleteUserModal');
        const userEmailToDelete = document.getElementById('userEmailToDelete');
        userEmailToDelete.textContent = userEmail;

        // Show the modal
        const modal = new bootstrap.Modal(deleteUserModal);
        modal.show();

        // Handle the confirm delete button click
        const confirmDeleteUserButton = document.getElementById('confirmDeleteUser');
        confirmDeleteUserButton.onclick = function () {
            // Call the delete user function
            deleteUser(userId);
            modal.hide();
        };
    }

    function deleteUser(userId) {
        const backendUrl = window.BACKEND_URL;
        const token = window.AUTH_TOKEN;

        fetch(backendUrl + '/user/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ _id: userId })
        })
            .then(response => {
                if (response.status === 200) {
                    return response.json()
                } else {
                    alert('Erro ao deletar usuário.');
                }
            }).then(data => {
                alert(data.message);
                loadManageUsers(); // Refresh the user list
            })
            .catch(error => {
                console.error('Erro ao deletar usuário:', error);
                alert('Erro ao deletar usuário.');
            });
    }

});
