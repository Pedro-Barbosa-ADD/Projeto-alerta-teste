function loadCustomersPage() {
    const backendUrl = window.BACKEND_URL;
    const token = window.AUTH_TOKEN;
    const mainContent = document.querySelector('main .container');

    fetch(backendUrl + '/api/all/customers', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(response => response.json())
        .then(customers => {
            let customerListHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h1>Gerenciar Clientes</h1>
                                        <p>Aqui você pode gerenciar os Clientes do sistema.</p>
                                    </div>
                                    <button class="btn btn-success" id="addUserButton" onclick="openAddCustomerModal()">
                                        <i class="bi bi-plus"></i> Adicionar Cliente
                                    </button>
                                </div>
                                
                                <div class="modal fade" id="addCustomerModal" tabindex="-1" aria-labelledby="addCustomerModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="addCustomerModalLabel">Adicionar Cliente</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                             <div class="modal-body">
                                                <div class="mb-3">
                                                    <label for="name" class="form-label">Customer Name</label>
                                                    <input type="text" class="form-control" id="customerName" placeholder="Digite o nome do cliente">
                                                </div>
                                                <div class="mb-3">
                                                    <label for="url" class="form-label">URL da Plataforma</label>
                                                    <input type="url" class="form-control" id="customerUrl" placeholder="Exemplo: https://plataforma.com.br">
                                                </div>
                                                <div class="mb-3">
                                                    <label for="token" class="form-label">Token da Plataforma</label>
                                                    <input type="password" class="form-control" id="customerToken" placeholder="Digite o token da plataforma">
                                                </div>
                                                <div class="mb-3">
                                                    <label for="typeList" class="form-label">Tipos de Sistemas</label>
                                                    <select id="typeOption" class="form-select">
                                                        <option value="cloudport">CloudPort</option>
                                                        <option value="c3po">C3PO</option>
                                                    </select>
                                                </div>
                                            </div>
                                             <div class="modal-footer">
                                                <button type="button" class="btn btn-primary" id="saveCustomerButton">Salvar</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="editUserModalLabel">Editar Cliente</h5>
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
                                                <button type="button" class="btn btn-primary" id="saveCustomerButton">Salvar</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal fade" id="deleteCustomerModal" tabindex="-1" aria-labelledby="deleteCustomerModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="deleteCustomerModalLabel">Confirmar Deleção</h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                        </div>
                                        <div class="modal-body">
                                            <p>Deseja realmente deletar o cliente <strong id="customerToDelete"></strong>?</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-danger" id="confirmDeleteCustomer">Sim</button>
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Não</button>
                                        </div>
                                        </div>
                                    </div>
                                </div>


                                <div class="container">`;

            document.querySelector('main .container').innerHTML = customerListHTML;
            //customersData = customers
            customers.forEach(customer => {
                const statusColor = customer.metadataFieldOptions?.length > 0 ? 'green' : 'gray';
                customerListHTML += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <h5 class="card-title">${customer.customer_name}</h5>
                                </div>
                                <div class="col-md-3">
                                    <p class="card-text">${(customer.system_info.system_type).toUpperCase()}</p>
                                </div>
                                <div class="col-md-2 d-flex align-items-center justify-content-center">
                                    <i class="bi bi-circle-fill" style="font-size: 1.0em; color: ${statusColor}; cursor: pointer;" title="${customer.metadataFieldOptions?.length > 0 ? 'Metadatada' : 'Sem Metadata'}"></i>
                                </div>
                                <div class="col-md-4 text-end">
                                    <a href="#" class="btn btn-primary btn-sm" onclick="openEditCustomerModal('${customer._id}')"><i class="bi bi-pencil"></i> Editar</a>
                                    <a href="#" class="btn btn-danger btn-sm" onclick="openDeleteCustomerModal('${customer._id}','${customer.customer_name}')"><i class="bi bi-trash"></i> Excluir</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            customerListHTML += '</div>';
            mainContent.innerHTML = customerListHTML;


        })
        .catch(error => {
            console.error('Erro ao buscar usuários:', error);
            mainContent.innerHTML = '<h1>Gerenciar Usuários</h1><p>Erro ao buscar usuários.</p>';
        });

}

window.openAddCustomerModal = function () {
    const backendUrl = window.BACKEND_URL;
    const token = window.AUTH_TOKEN;
    const addCustomerModal = document.getElementById('addCustomerModal');

    // Usa o Bootstrap Modal
    const modal = new bootstrap.Modal(addCustomerModal);
    modal.show();

    // Limpa campos e estados anteriores
    document.getElementById('customerName').value = '';
    document.getElementById('customerUrl').value = '';
    document.getElementById('customerToken').value = '';
    document.getElementById('typeOption').value = '';


    // Configura o botão de salvar
    const saveCustomerButton = document.getElementById('saveCustomerButton');
    if (saveCustomerButton) {
        saveCustomerButton.onclick = function () {
            const customerName = document.getElementById('customerName').value;
            const customerUrl = document.getElementById('customerUrl').value;
            const customerToken = document.getElementById('customerToken').value;
            const typeOption = document.getElementById('typeOption').value;

            const customerData = {
                customer_name: customerName,
                system_info: {
                    system_type: typeOption,
                    url: customerUrl,
                    playout_token: customerToken
                }
            };

            fetch(backendUrl + '/api/register/customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(customerData)
            })
                .then(response => {
                    response.clone().text().then(text => {
                        alert(`Resposta: ${text}\nCódigo: ${response.status}`);
                        if (response.status === 200) {
                            loadCustomersPage();
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
    const closeButton = addCustomerModal.querySelector('.btn-close');
    const cancelButton = addCustomerModal.querySelector('.btn-secondary');
    if (closeButton) closeButton.onclick = () => modal.hide();
    if (cancelButton) cancelButton.onclick = () => modal.hide();
};

window.openDeleteCustomerModal = function (customerId, customerName) {
    const deleteCustomerModal = document.getElementById('deleteCustomerModal');
    const customerToDelete = document.getElementById('customerToDelete');
    customerToDelete.textContent = customerName;


    // Show the modal
    const modal = new bootstrap.Modal(deleteCustomerModal);
    modal.show();

    // Handle the confirm delete button click
    const confirmDeleteCustomerButton = document.getElementById('confirmDeleteCustomer');
    confirmDeleteCustomerButton.onclick = function () {
        // Call the delete user function
        deleteCustomer(customerId);
        modal.hide();
    };
    function deleteCustomer(customerId) {
        const backendUrl = window.BACKEND_URL;
        const token = window.AUTH_TOKEN;

        fetch(backendUrl + '/api/delete/customer', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ customer_id: customerId })
        })
            .then(response => {
                if (response.status === 200) {
                    return response.json()
                } else {
                    alert('Erro ao deletar cliente.');
                }
            }).then(data => {
                alert(data.message);
                loadCustomersPage(); // Refresh the user list
            })
            .catch(error => {
                console.error('Erro ao deletar cliente:', error);
                alert('Erro ao deletar cliente.');
            });
    }
}
