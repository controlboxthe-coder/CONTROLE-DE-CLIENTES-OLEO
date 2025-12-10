/**
 * SISTEMA DE CONTROLE DE TROCA DE ÓLEO + GARANTIAS
 * ========================================
 * Aplicação web responsiva para gerenciar manutenções de veículos e garantias de serviços
 * Stack: HTML5 + CSS3 + JavaScript ES6+
 */

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================
const CONFIG = {
    OIL_CHANGE_STORAGE_KEY: 'oil_change_records',
    WARRANTY_STORAGE_KEY: 'warranty_records',
    DAYS_BETWEEN_MAINTENANCE: 29,
    WARNING_DAYS: 7,
    CRITICAL_DAYS: 3,
};

// ============================================
// CLASSE PARA GERENCIAR REGISTOS DE ÓLEO
// ============================================
class OilChangeManager {
    constructor() {
        this.records = this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(CONFIG.OIL_CHANGE_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao carregar registos de óleo:', error);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.OIL_CHANGE_STORAGE_KEY, JSON.stringify(this.records));
        } catch (error) {
            console.error('Erro ao salvar registos de óleo:', error);
        }
    }

    calculateNextMaintenanceDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + CONFIG.DAYS_BETWEEN_MAINTENANCE);
        return this.formatDateToISO(nextDate);
    }

    formatDateToISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    addRecord(data) {
        const nextDate = this.calculateNextMaintenanceDate(data.data_troca);

        const newRecord = {
            id: Date.now(),
            cliente: data.cliente,
            veiculo: data.veiculo,
            km: parseInt(data.km),
            data_troca: data.data_troca,
            data_proxima: nextDate,
            telefone: data.telefone || '',
            endereco: data.endereco || '',
            avisado: false,
            criado_em: this.formatDateToISO(new Date()),
        };

        this.records.push(newRecord);
        this.saveToStorage();
        return newRecord;
    }

    markAsNotified(id) {
        const record = this.records.find(r => r.id === id);
        if (record) {
            record.avisado = !record.avisado;
            this.saveToStorage();
        }
    }

    deleteRecord(id) {
        this.records = this.records.filter(record => record.id !== id);
        this.saveToStorage();
    }

    calculateDaysRemaining(nextDate) {
        const [year, month, day] = nextDate.split('-').map(Number);
        const nextMaintenance = new Date(year, month - 1, day);
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        nextMaintenance.setHours(0, 0, 0, 0);

        const timeDifference = nextMaintenance - today;
        const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        return daysRemaining;
    }

    getMaintenanceStatus(daysRemaining) {
        if (daysRemaining < 0) return 'danger';      // Vencido - vermelho
        if (daysRemaining <= 2) return 'critical';    // Próximo 2 dias - vermelho escuro
        if (daysRemaining <= 10) return 'warning';    // Próximo 2-10 dias - amarelo
        return 'normal';                              // Recente - verde
    }

    getSortedRecords() {
        // Ordena por dias restantes (urgentes primeiro)
        return [...this.records].sort((a, b) => {
            const daysA = this.calculateDaysRemaining(a.data_proxima);
            const daysB = this.calculateDaysRemaining(b.data_proxima);
            return daysA - daysB;
        });
    }
}

// ============================================
// CLASSE PARA GERENCIAR GARANTIAS
// ============================================
class WarrantyManager {
    constructor() {
        this.records = this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(CONFIG.WARRANTY_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao carregar garantias:', error);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.WARRANTY_STORAGE_KEY, JSON.stringify(this.records));
        } catch (error) {
            console.error('Erro ao salvar garantias:', error);
        }
    }

    formatDateToISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    calculateWarrantyExpiryDate(serviceDate, warrantyDays) {
        const [year, month, day] = serviceDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + warrantyDays);
        return this.formatDateToISO(expiryDate);
    }

    addRecord(data) {
        const expiryDate = this.calculateWarrantyExpiryDate(data.data_servico, parseInt(data.dias_garantia));

        const newRecord = {
            id: Date.now(),
            cliente: data.cliente,
            veiculo: data.veiculo,
            telefone: data.telefone || '',
            data_servico: data.data_servico,
            dias_garantia: parseInt(data.dias_garantia),
            data_vencimento: expiryDate,
            servico: data.servico,
            valor: parseFloat(data.valor),
            criado_em: this.formatDateToISO(new Date()),
        };

        this.records.push(newRecord);
        this.saveToStorage();
        return newRecord;
    }

    deleteRecord(id) {
        this.records = this.records.filter(record => record.id !== id);
        this.saveToStorage();
    }

    calculateDaysRemaining(expiryDate) {
        const [year, month, day] = expiryDate.split('-').map(Number);
        const expiry = new Date(year, month - 1, day);
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        const timeDifference = expiry - today;
        const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        return daysRemaining;
    }

    getWarrantyStatus(daysRemaining) {
        if (daysRemaining < 0) return 'expired';
        if (daysRemaining <= 3) return 'critical';
        if (daysRemaining <= 10) return 'warning';
        return 'active';
    }

    getSortedRecords() {
        return [...this.records].sort((a, b) => {
            const daysA = this.calculateDaysRemaining(a.data_vencimento);
            const daysB = this.calculateDaysRemaining(b.data_vencimento);
            return daysA - daysB;
        });
    }
}

// ============================================
// CLASSE PARA GERENCIAR A UI
// ============================================
class OilChangeUI {
    constructor(oilManager, warrantyManager) {
        this.oilManager = oilManager;
        this.warrantyManager = warrantyManager;
        
        this.oilForm = document.getElementById('oilChangeForm');
        this.warrantyForm = document.getElementById('warrantyForm');
        this.recordsList = document.getElementById('recordsList');
        this.warrantiesList = document.getElementById('warrantiesList');
        this.dateInput = document.getElementById('dateChange');
        this.warrantyDateInput = document.getElementById('warrantyDate');

        this.setupEventListeners();
        this.setDefaultDates();
        this.renderOilRecords();
        this.renderWarranties();
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTabChange(e));
        });

        this.oilForm.addEventListener('submit', (e) => this.handleOilFormSubmit(e));
        this.warrantyForm.addEventListener('submit', (e) => this.handleWarrantyFormSubmit(e));
        
        // Fix iOS teclado: adiciona handlers para todos os inputs
        this.setupIOSKeyboardFix();
    }

    /**
     * Fix para teclado no iOS standalone
     */
    setupIOSKeyboardFix() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = window.navigator.standalone === true;
        
        if (isIOS && isStandalone) {
            // Adiciona handler para todos os inputs existentes e futuros
            document.addEventListener('touchstart', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    // Garante que o input receba focus
                    setTimeout(() => {
                        e.target.focus();
                        // Força o teclado a aparecer
                        e.target.setSelectionRange(0, 0);
                    }, 50);
                }
            }, { passive: true });
            
            // Fix para quando o documento é tocado
            document.addEventListener('focus', (e) => {
                if (e.target.tagName === 'INPUT') {
                    // Scroll para o input se necessário
                    setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }, { capture: true, passive: true });
        }
    }

    handleTabChange(event) {
        const tabName = event.target.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    setDefaultDates() {
        const today = new Date();
        const isoDate = this.oilManager.formatDateToISO(today);
        this.dateInput.value = isoDate;
        this.warrantyDateInput.value = isoDate;
    }

    handleOilFormSubmit(event) {
        event.preventDefault();

        const formData = {
            cliente: document.getElementById('clientName').value.trim(),
            veiculo: document.getElementById('vehicleModel').value.trim(),
            km: document.getElementById('kmCurrent').value,
            data_troca: document.getElementById('dateChange').value,
            telefone: document.getElementById('phoneClient').value.trim(),
            endereco: document.getElementById('addressClient').value.trim(),
        };

        if (!formData.cliente || !formData.veiculo || !formData.km || !formData.data_troca) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        this.oilManager.addRecord(formData);
        this.oilForm.reset();
        this.setDefaultDates();
        this.renderOilRecords();
        this.showSuccessMessage(this.oilForm.querySelector('.btn-submit'));
    }

    handleWarrantyFormSubmit(event) {
        event.preventDefault();

        const formData = {
            cliente: document.getElementById('warrantyClient').value.trim(),
            veiculo: document.getElementById('warrantyVehicle').value.trim(),
            telefone: document.getElementById('warrantyPhone').value.trim(),
            data_servico: document.getElementById('warrantyDate').value,
            dias_garantia: document.getElementById('warrantyDays').value,
            servico: document.getElementById('warrantyService').value.trim(),
            valor: document.getElementById('warrantyValue').value,
        };

        if (!formData.cliente || !formData.veiculo || !formData.data_servico || !formData.dias_garantia || !formData.servico || !formData.valor) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        this.warrantyManager.addRecord(formData);
        this.warrantyForm.reset();
        this.setDefaultDates();
        this.renderWarranties();
        this.showSuccessMessage(this.warrantyForm.querySelector('.btn-submit'));
    }

    showSuccessMessage(btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Registo Adicionado com Sucesso!';
        btn.style.backgroundColor = 'var(--success-color)';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 3000);
    }

    formatDatePT(isoDate) {
        const [year, month, day] = isoDate.split('-');
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    renderOilRecords() {
        const records = this.oilManager.getSortedRecords();

        if (records.length === 0) {
            this.recordsList.innerHTML = `
                <p class="empty-state">
                    🚗 Nenhum registo de manutenção ainda. 
                    Complete o formulário acima para começar.
                </p>
            `;
            return;
        }

        this.recordsList.innerHTML = records.map(record => this.createOilRecordCard(record)).join('');

        document.querySelectorAll('.btn-notified').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.handleNotifiedClick(id);
            });
        });

        document.querySelectorAll('.btn-delete-oil').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.handleDeleteOilRecord(id);
            });
        });
    }

    handleNotifiedClick(id) {
        this.oilManager.markAsNotified(id);
        this.renderOilRecords();
    }

    createOilRecordCard(record) {
        const daysRemaining = this.oilManager.calculateDaysRemaining(record.data_proxima);
        const status = this.oilManager.getMaintenanceStatus(daysRemaining);

        let statusClass = '';
        let icon = '🟢';
        
        if (status === 'danger') {
            statusClass = 'danger';
            icon = '❌';
        } else if (status === 'critical') {
            statusClass = 'critical';
            icon = '🔴';
        } else if (status === 'warning') {
            statusClass = 'warning';
            icon = '🟡';
        }

        let contactInfo = '';
        if (record.telefone || record.endereco) {
            contactInfo = `
                <div class="record-detail">
                    <span class="record-detail-label">Contacto</span>
                    <span class="record-detail-value">
                        ${record.telefone ? '📱 ' + record.telefone : ''}
                        ${record.telefone && record.endereco ? '<br>' : ''}
                        ${record.endereco ? '📍 ' + record.endereco : ''}
                    </span>
                </div>
            `;
        }

        return `
            <div class="record-card ${statusClass}">
                <div class="record-header">
                    <div>
                        <div class="record-client">👤 ${record.cliente}</div>
                        <div class="record-vehicle">🚗 ${record.veiculo}</div>
                    </div>
                    <div class="record-actions">
                        <button class="btn-notified ${record.avisado ? 'notified' : ''}" data-id="${record.id}" title="Marcar como avisado">
                            ${record.avisado ? '✅' : '⏰'} Avisado
                        </button>
                        <button class="btn-delete btn-delete-oil" data-id="${record.id}" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>

                <div class="record-details">
                    <div class="record-detail">
                        <span class="record-detail-label">Quilometragem</span>
                        <span class="record-detail-value">${record.km.toLocaleString('pt-BR')} km</span>
                    </div>

                    <div class="record-detail">
                        <span class="record-detail-label">Data da Troca</span>
                        <span class="record-detail-value">${this.formatDatePT(record.data_troca)}</span>
                    </div>
                    ${contactInfo}
                </div>

                <div class="next-change ${statusClass}">
                    <span class="next-change-label">${icon} Próxima Manutenção</span>
                    <span class="next-change-date">${this.formatDatePT(record.data_proxima)}</span>
                    <span class="days-remaining">
                        ${daysRemaining === 0 
                            ? '⚠️ É HOJE!' 
                            : daysRemaining === 1 
                            ? '⚠️ Amanhã!' 
                            : daysRemaining > 0
                            ? `Em ${daysRemaining} dias`
                            : `Vencido há ${Math.abs(daysRemaining)} dias`
                        }
                    </span>
                </div>
            </div>
        `;
    }

    handleDeleteOilRecord(id) {
        if (confirm('Tem a certeza que deseja excluir este registo?')) {
            this.oilManager.deleteRecord(id);
            this.renderOilRecords();
        }
    }

    renderWarranties() {
        const records = this.warrantyManager.getSortedRecords();

        if (records.length === 0) {
            this.warrantiesList.innerHTML = `
                <p class="empty-state">
                    ✅ Nenhuma garantia registada ainda. 
                    Complete o formulário acima para começar.
                </p>
            `;
            return;
        }

        this.warrantiesList.innerHTML = records.map(record => this.createWarrantyCard(record)).join('');

        document.querySelectorAll('.btn-delete-warranty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.handleDeleteWarranty(id);
            });
        });
    }

    createWarrantyCard(record) {
        const daysRemaining = this.warrantyManager.calculateDaysRemaining(record.data_vencimento);
        const status = this.warrantyManager.getWarrantyStatus(daysRemaining);

        let statusIcon = '🟢';
        let statusLabel = 'Garantia Ativa';

        if (status === 'expired') {
            statusIcon = '❌';
            statusLabel = 'Garantia Expirada';
        } else if (status === 'critical') {
            statusIcon = '🔴';
            statusLabel = 'Vencimento Próximo';
        } else if (status === 'warning') {
            statusIcon = '🟡';
            statusLabel = 'Vencimento em Breve';
        }

        return `
            <div class="record-card warranty-card">
                <div class="record-header">
                    <div>
                        <div class="record-client">👤 ${record.cliente}</div>
                        <div class="record-vehicle">🚗 ${record.veiculo}</div>
                    </div>
                    <div class="record-actions">
                        <button class="btn-print" onclick="window.ui.printWarranty({
                            cliente: '${record.cliente.replace(/'/g, "\\'")}',
                            veiculo: '${record.veiculo.replace(/'/g, "\\'")}',
                            data_servico: '${record.data_servico}',
                            data_vencimento: '${record.data_vencimento}',
                            servico: '${record.servico.replace(/'/g, "\\'")}',
                            valor: ${record.valor},
                            dias_garantia: ${record.dias_garantia},
                            status: '${statusLabel}',
                            statusIcon: '${statusIcon}'
                        })" title="Imprimir esta garantia">
                            🖨️
                        </button>
                        <button class="btn-delete btn-delete-warranty" data-id="${record.id}" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>

                <div class="warranty-status">
                    <div class="next-change ${status}">
                        <span>${statusIcon} ${statusLabel}</span>
                    </div>
                </div>

                <div class="warranty-header">
                    <h3>📋 TERMO DE GARANTIA DE SERVIÇO</h3>
                </div>

                <div class="warranty-body">
                    <div class="warranty-item">
                        <label>Cliente:</label>
                        <span>${record.cliente}</span>
                    </div>
                    <div class="warranty-item">
                        <label>Telefone:</label>
                        <span>${record.telefone || '—'}</span>
                    </div>
                    <div class="warranty-item">
                        <label>Veículo:</label>
                        <span>${record.veiculo}</span>
                    </div>
                    <div class="warranty-item">
                        <label>Data do Serviço:</label>
                        <span>${this.formatDatePT(record.data_servico)}</span>
                    </div>
                    <div class="warranty-item">
                        <label>Vencimento da Garantia:</label>
                        <span>${this.formatDatePT(record.data_vencimento)}</span>
                    </div>
                    <div class="warranty-item">
                        <label>Serviço Realizado:</label>
                        <span>${record.servico}</span>
                    </div>
                    <div class="warranty-item">
                        <label>Período de Garantia:</label>
                        <span>${record.dias_garantia} dias</span>
                    </div>
                </div>

                <div class="warranty-footer">
                    <p>⚠️ <strong>Atenção:</strong> Esta garantia é válida até ${this.formatDatePT(record.data_vencimento)}</p>
                    <p>Guardar este comprovante para eventuais reclamações.</p>
                </div>
            </div>
        `;
    }

    handleDeleteWarranty(id) {
        if (confirm('Tem a certeza que deseja excluir esta garantia?')) {
            this.warrantyManager.deleteRecord(id);
            this.renderWarranties();
        }
    }

    printWarranty(record) {
        const printWindow = window.open('', '', 'width=800,height=1000');
        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Termo de Garantia de Serviço</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: white;
                        padding: 0;
                    }
                    
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border: 3px solid #FF6B6B;
                        border-radius: 10px;
                        padding: 30px;
                        page-break-after: always;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                        border-bottom: 3px solid #FF6B6B;
                        padding-bottom: 15px;
                    }
                    
                    .logo {
                        max-width: 150px;
                        height: auto;
                        margin: 0 auto 15px;
                    }
                    
                    .header h1 {
                        color: #FF6B6B;
                        font-size: 1.8rem;
                        margin-bottom: 5px;
                    }
                    
                    .header .subtitle {
                        color: #666;
                        font-size: 0.9rem;
                        font-style: italic;
                    }
                    
                    .client-info {
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        border-left: 4px solid #FF6B6B;
                    }
                    
                    .client-info .name {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #FF6B6B;
                        margin-bottom: 3px;
                    }
                    
                    .client-info .vehicle {
                        font-size: 1rem;
                        color: #666;
                        font-style: italic;
                    }
                    
                    .content {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .item {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .item label {
                        font-weight: 700;
                        color: #FF6B6B;
                        font-size: 0.85rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                    }
                    
                    .item span {
                        font-size: 0.95rem;
                        color: #333;
                    }
                    
                    .notice {
                        background: #fff3cd;
                        border-left: 4px solid #F39C12;
                        padding: 12px 15px;
                        margin: 15px 0;
                        border-radius: 4px;
                        font-size: 0.9rem;
                        color: #856404;
                    }
                    
                    .notice strong {
                        display: block;
                        margin-bottom: 5px;
                    }
                    
                    .signatures {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-top: 40px;
                        padding-top: 20px;
                    }
                    
                    .signature-box {
                        text-align: center;
                    }
                    
                    .signature-line {
                        border-top: 1px solid #333;
                        margin-top: 50px;
                        padding-top: 10px;
                        font-weight: 700;
                        font-size: 0.9rem;
                    }
                    
                    .signature-title {
                        font-size: 0.85rem;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    
                    .footer {
                        text-align: center;
                        padding-top: 15px;
                        border-top: 2px dashed #ddd;
                        color: #999;
                        font-size: 0.85rem;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="logosvg.png" alt="Box Motors Logo" class="logo" style="max-width: 80px; height: auto; margin: 0 auto 15px;">
                        <h1>📋 TERMO DE GARANTIA</h1>
                        <p class="subtitle">De Serviço Executado</p>
                    </div>
                    
                    <div class="client-info">
                        <div class="name">👤 ${record.cliente}</div>
                        <div class="vehicle">🚗 ${record.veiculo}</div>
                    </div>
                    
                    <div class="content">
                        <div class="item">
                            <label>Cliente</label>
                            <span>${record.cliente}</span>
                        </div>
                        <div class="item">
                            <label>Telefone</label>
                            <span>${record.telefone || '—'}</span>
                        </div>
                        
                        <div class="item">
                            <label>Data do Serviço</label>
                            <span>${this.formatDatePT(record.data_servico)}</span>
                        </div>
                        <div class="item">
                            <label>Vencimento</label>
                            <span>${this.formatDatePT(record.data_vencimento)}</span>
                        </div>
                        
                        <div class="item">
                            <label>Veículo</label>
                            <span>${record.veiculo}</span>
                        </div>
                        <div class="item">
                            <label>Serviço Realizado</label>
                            <span>${record.servico}</span>
                        </div>
                        
                        <div class="item">
                            <label>Período de Garantia</label>
                            <span>${record.dias_garantia} dias</span>
                        </div>
                        <div class="item">
                            <label>Status</label>
                            <span>${record.statusIcon} ${record.status}</span>
                        </div>
                    </div>
                    
                    <div class="notice">
                        <strong>⚠️ Atenção:</strong>
                        Esta garantia é válida até <strong>${this.formatDatePT(record.data_vencimento)}</strong>. Guardar este comprovante para eventuais reclamações.
                    </div>
                    
                    <div class="signatures">
                        <div class="signature-box">
                            <div class="signature-title">Assinatura da Mecânica</div>
                            <div style="height: 60px;"></div>
                            <div class="signature-line">BOX MOTORS</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-title">Assinatura do Cliente</div>
                            <div style="height: 60px;"></div>
                            <div class="signature-line">${record.cliente}</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>© 2025 Sistema de Controle | Desenvolvido por Will & Copilot</p>
                        <p>Data de Impressão: ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                
                <script>
                    setTimeout(function() {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

// ============================================
// CLASSE PARA GERENCIAR BACKUPS
// ============================================
class BackupManager {
    constructor(oilManager, warrantyManager) {
        this.oilManager = oilManager;
        this.warrantyManager = warrantyManager;
    }

    /**
     * Cria um backup completo em JSON
     */
    createBackup() {
        const backup = {
            versao: '1.0',
            dataBackup: new Date().toISOString(),
            timestamp: new Date().getTime(),
            oilChanges: this.oilManager.records,
            warranties: this.warrantyManager.records,
            totalRecords: {
                oilChanges: this.oilManager.records.length,
                warranties: this.warrantyManager.records.length
            }
        };
        return backup;
    }

    /**
     * Exporta backup como arquivo JSON
     */
    exportBackup() {
        const backup = this.createBackup();
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        link.href = url;
        link.download = `backup_${dateStr}_${timeStr}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Backup exportado com sucesso!');
        return backup;
    }

    /**
     * Importa dados de um arquivo JSON de backup
     */
    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    
                    // Validações
                    if (!backup.versao || !backup.oilChanges || !backup.warranties) {
                        throw new Error('Formato de backup inválido');
                    }
                    
                    // Restaura os dados
                    this.oilManager.records = backup.oilChanges;
                    this.oilManager.saveToStorage();
                    
                    this.warrantyManager.records = backup.warranties;
                    this.warrantyManager.saveToStorage();
                    
                    console.log('Backup importado com sucesso!');
                    resolve({
                        success: true,
                        message: `Backup restaurado: ${backup.oilChanges.length} trocas de óleo e ${backup.warranties.length} garantias`,
                        backup: backup
                    });
                } catch (error) {
                    reject({
                        success: false,
                        message: 'Erro ao importar backup: ' + error.message,
                        error: error
                    });
                }
            };
            
            reader.onerror = () => {
                reject({
                    success: false,
                    message: 'Erro ao ler o arquivo',
                    error: reader.error
                });
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Obtém informações do backup
     */
    getBackupInfo() {
        const backup = this.createBackup();
        return {
            data: new Date(backup.dataBackup).toLocaleDateString('pt-BR'),
            hora: new Date(backup.dataBackup).toLocaleTimeString('pt-BR'),
            oilChanges: backup.totalRecords.oilChanges,
            warranties: backup.totalRecords.warranties,
            tamanhoEstimado: this.estimateBackupSize()
        };
    }

    /**
     * Estima o tamanho do backup em KB
     */
    estimateBackupSize() {
        const backup = JSON.stringify(this.createBackup());
        return (new Blob([backup]).size / 1024).toFixed(2) + ' KB';
    }

    /**
     * Limpa todos os dados (com confirmação)
     */
    clearAllData() {
        if (confirm('⚠️ CUIDADO! Isto vai apagar TODOS os dados. Tem certeza?\n\nFaça um backup antes de continuar!')) {
            this.oilManager.records = [];
            this.oilManager.saveToStorage();
            this.warrantyManager.records = [];
            this.warrantyManager.saveToStorage();
            console.log('Todos os dados foram apagados');
            return true;
        }
        return false;
    }
}

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const oilManager = new OilChangeManager();
    const warrantyManager = new WarrantyManager();
    const ui = new OilChangeUI(oilManager, warrantyManager);
    const backupManager = new BackupManager(oilManager, warrantyManager);

    window.oilChangeApp = { oilManager, warrantyManager, ui, backupManager };
    window.ui = ui;
    window.backupManager = backupManager;
    
    // Inicializa os controles de backup
    initializeBackupControls(backupManager, ui);
});

/**
 * Inicializa os controles de backup na interface
 */
function initializeBackupControls(backupManager, ui) {
    const exportBtn = document.getElementById('exportBackupBtn');
    const importBtn = document.getElementById('importBackupBtn');
    const fileInput = document.getElementById('backupFileInput');
    const infoBtn = document.getElementById('backupInfoBtn');
    const clearBtn = document.getElementById('clearDataBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                backupManager.exportBackup();
                alert('✅ Backup exportado com sucesso!');
            } catch (error) {
                alert('❌ Erro ao exportar: ' + error.message);
            }
        });
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            fileInput?.click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const result = await backupManager.importBackup(file);
                alert('✅ ' + result.message);
                
                // Aguarda um pouco e depois atualiza a interface
                setTimeout(() => {
                    if (typeof ui.renderOilChangeRecords === 'function') {
                        ui.renderOilChangeRecords();
                    }
                    if (typeof ui.renderWarrantyRecords === 'function') {
                        ui.renderWarrantyRecords();
                    }
                }, 100);
                
                fileInput.value = '';
            } catch (error) {
                alert('❌ ' + error.message);
                fileInput.value = '';
            }
        });
    }
    
    if (infoBtn) {
        infoBtn.addEventListener('click', () => {
            const info = backupManager.getBackupInfo();
            const message = `📊 Informações do Backup:\n\n` +
                `Data: ${info.data}\n` +
                `Hora: ${info.hora}\n` +
                `Trocas de Óleo: ${info.oilChanges}\n` +
                `Garantias: ${info.warranties}\n` +
                `Tamanho Est: ${info.tamanhoEstimado}`;
            alert(message);
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (backupManager.clearAllData()) {
                setTimeout(() => {
                    if (typeof ui.renderOilChangeRecords === 'function') {
                        ui.renderOilChangeRecords();
                    }
                    if (typeof ui.renderWarrantyRecords === 'function') {
                        ui.renderWarrantyRecords();
                    }
                }, 100);
                alert('✅ Todos os dados foram limpos');
            }
        });
    }
}
