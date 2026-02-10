/**
 * UIComponent Management System
 * 統一されたコンポーネント管理システム
 */

class UIComponentManager {
    constructor() {
        this.components = new Map();
        this.eventManager = new EventManager();
        this.stateManager = new StateManager();
        this.validator = new ComponentValidator();
        
        this.init();
    }
    
    init() {
        console.log('[ComponentManager] Initializing...');
        this.setupDefaultComponents();
        this.validateAllComponents();
    }
    
    /**
     * コンポーネントの登録
     */
    registerComponent(name, config) {
        const component = new UIComponent(name, config, this);
        this.components.set(name, component);
        
        // 自動バリデーション
        this.validator.validateComponent(component);
        
        console.log(`[ComponentManager] Registered: ${name}`);
        return component;
    }
    
    /**
     * コンポーネントの取得
     */
    getComponent(name) {
        return this.components.get(name);
    }
    
    /**
     * デフォルトコンポーネントの設定
     */
    setupDefaultComponents() {
        // モバイルモーダルコンポーネント
        this.registerComponent('mobileModal', {
            selector: '#mobileModal',
            template: 'mobile-modal-template',
            events: {
                'click #mobileModalClose': 'hide',
                'click #mobileCancelBtn': 'hide',
                'click #mobileSaveBtn': 'save',
                'click #mobileDeleteBtn': 'delete',
                'click': 'handleBackgroundClick'
            },
            state: {
                isOpen: false,
                currentTask: null,
                formData: {}
            },
            methods: {
                show: function(data = {}) {
                    console.log('[MobileModal] Showing modal with data:', data);
                    this.setState({ isOpen: true, currentTask: data });
                    
                    // 明示的にスタイルを設定
                    this.element.style.display = 'block';
                    this.element.style.position = 'fixed';
                    this.element.style.top = '0';
                    this.element.style.left = '0';
                    this.element.style.width = '100%';
                    this.element.style.height = '100%';
                    this.element.style.zIndex = '10000';
                    this.element.style.background = '#f5f5f5';
                    this.element.style.visibility = 'visible';
                    this.element.style.opacity = '1';
                    
                    // タイトルを設定
                    const titleElement = this.element.querySelector('#mobileModalTitle');
                    if (titleElement) {
                        titleElement.textContent = data && data.title ? 'Edit Task' : 'Add Task';
                    }
                    
                    // フォームデータを設定
                    if (data && data.title) {
                        const titleInput = this.element.querySelector('#mobileTaskTitle');
                        if (titleInput) titleInput.value = data.title;
                        
                        const detailsInput = this.element.querySelector('#mobileTaskDetails');
                        if (detailsInput) detailsInput.value = data.details || '';
                    }
                    
                    this.focusFirstInput();
                },
                hide: function() {
                    console.log('[MobileModal] Hiding modal');
                    this.setState({ isOpen: false });
                    this.element.style.display = 'none';
                    this.resetForm();
                },
                save: function() {
                    console.log('[MobileModal] Saving form data');
                    const formData = this.getFormData();
                    this.emit('save', formData);
                    this.hide();
                },
                delete: function() {
                    console.log('[MobileModal] Deleting task');
                    this.emit('delete', this.state.currentTask);
                    this.hide();
                },
                handleBackgroundClick: function(event) {
                    // 背景クリック時のみモーダルを閉じる
                    if (event.target === this.element) {
                        console.log('[MobileModal] Background clicked - hiding modal');
                        this.hide();
                    }
                }
            }
        });
        
        // タスクリストコンポーネント
        this.registerComponent('taskList', {
            selector: '#taskList',
            template: 'task-list-template',
            events: {
                'click .task-checkbox': 'toggleComplete',
                'click .task-edit': 'editTask',
                'click .task-delete': 'deleteTask'
            },
            state: {
                tasks: [],
                filter: 'all'
            },
            methods: {
                render: function() {
                    this.element.innerHTML = this.generateTaskHTML();
                },
                addTask: function(task) {
                    const tasks = [...this.state.tasks, task];
                    this.setState({ tasks });
                    this.render();
                },
                toggleComplete: function(event) {
                    const taskId = event.target.dataset.taskId;
                    const tasks = this.state.tasks.map(task => 
                        task.id === taskId ? { ...task, completed: !task.completed } : task
                    );
                    this.setState({ tasks });
                    this.render();
                }
            }
        });
    }
    
    /**
     * 全コンポーネントの検証
     */
    validateAllComponents() {
        for (const [name, component] of this.components) {
            this.validator.validateComponent(component);
        }
    }
    
    /**
     * コンポーネントの初期化
     */
    initializeComponents() {
        for (const [name, component] of this.components) {
            if (component.initialize) {
                component.initialize();
            }
        }
    }
    
    /**
     * 失敗したコンポーネントの再初期化
     */
    reinitializeFailedComponents() {
        for (const [name, component] of this.components) {
            if (!component.element) {
                console.log(`[ComponentManager] Reinitializing failed component: ${name}`);
                component.init();
            }
        }
    }
    
    /**
     * 破棄処理
     */
    destroy() {
        for (const [name, component] of this.components) {
            component.destroy();
        }
        this.components.clear();
        this.eventManager.destroy();
    }
}

/**
 * 個別UIコンポーネント
 */
class UIComponent {
    constructor(name, config, manager) {
        this.name = name;
        this.config = config;
        this.manager = manager;
        this.element = null;
        this.state = { ...config.state };
        this.events = new Map();
        
        this.init();
    }
    
    init() {
        this.element = document.querySelector(this.config.selector);
        if (!this.element) {
            console.error(`[UIComponent] Element not found: ${this.config.selector}`);
            return;
        }
        
        this.setupEvents();
        this.setupMethods();
        
        console.log(`[UIComponent] Initialized: ${this.name}`);
    }
    
    initialize() {
        // 明示的な初期化メソッド
        this.init();
    }
    
    setupEvents() {
        if (!this.config.events) return;
        
        for (const [eventSelector, methodName] of Object.entries(this.config.events)) {
            this.manager.eventManager.on(this.element, eventSelector, (event) => {
                if (this.methods[methodName]) {
                    this.methods[methodName].call(this, event);
                }
            });
        }
    }
    
    setupMethods() {
        this.methods = {};
        if (this.config.methods) {
            for (const [methodName, method] of Object.entries(this.config.methods)) {
                this.methods[methodName] = method.bind(this);
            }
        }
    }
    
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.onStateChange(oldState, this.state);
    }
    
    getState() {
        return { ...this.state };
    }
    
    onStateChange(oldState, newState) {
        // オーバーライド可能
        console.log(`[${this.name}] State changed:`, { oldState, newState });
    }
    
    emit(eventName, data) {
        this.manager.eventManager.emit(this.element, eventName, data);
    }
    
    on(eventName, handler) {
        this.manager.eventManager.on(this.element, eventName, handler);
    }
    
    destroy() {
        this.manager.eventManager.removeAllListeners(this.element);
        this.methods = {};
        this.state = {};
    }
    
    // ヘルパーメソッド
    focusFirstInput() {
        const firstInput = this.element.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    resetForm() {
        const form = this.element.querySelector('form');
        if (form) {
            form.reset();
        }
    }
    
    getFormData() {
        const form = this.element.querySelector('form');
        if (form) {
            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        }
        
        // フォームがない場合は個別の入力要素から取得
        const data = {};
        
        const titleInput = this.element.querySelector('#mobileTaskTitle');
        if (titleInput) data.title = titleInput.value;
        
        const detailsInput = this.element.querySelector('#mobileTaskDetails');
        if (detailsInput) data.details = detailsInput.value;
        
        const repeatSelect = this.element.querySelector('#mobileRepeatInterval');
        if (repeatSelect) data.repeat = repeatSelect.value;
        
        return data;
    }
    
    generateTaskHTML() {
        // タスクリスト生成のサンプル実装
        return this.state.tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${task.title}</span>
                <button class="task-edit" data-task-id="${task.id}">Edit</button>
                <button class="task-delete" data-task-id="${task.id}">Delete</button>
            </div>
        `).join('');
    }
}

/**
 * イベント管理システム
 */
class EventManager {
    constructor() {
        this.listeners = new Map();
        this.listenerCounter = 0;
    }
    
    on(element, eventSelector, handler) {
        const id = ++this.listenerCounter;
        
        let target = element;
        let eventType = eventSelector;
        
        // セレクターが含まれている場合の処理
        if (eventSelector.includes(' ')) {
            const [event, selector] = eventSelector.split(' ', 2);
            eventType = event;
            
            const delegatedHandler = (event) => {
                if (event.target.matches(selector)) {
                    handler(event);
                }
            };
            
            element.addEventListener(eventType, delegatedHandler);
            this.listeners.set(id, { element, eventType, handler: delegatedHandler });
        } else {
            element.addEventListener(eventType, handler);
            this.listeners.set(id, { element, eventType, handler });
        }
        
        return id;
    }
    
    off(listenerId) {
        const listener = this.listeners.get(listenerId);
        if (listener) {
            listener.element.removeEventListener(listener.eventType, listener.handler);
            this.listeners.delete(listenerId);
        }
    }
    
    emit(element, eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        element.dispatchEvent(event);
    }
    
    removeAllListeners(element) {
        for (const [id, listener] of this.listeners) {
            if (listener.element === element) {
                this.off(id);
            }
        }
    }
    
    destroy() {
        for (const [id] of this.listeners) {
            this.off(id);
        }
    }
}

/**
 * 状態管理システム
 */
class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
    }
    
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // 購読者への通知
        const keySubscribers = this.subscribers.get(key) || [];
        keySubscribers.forEach(callback => callback(value, oldValue));
    }
    
    getState(key) {
        return this.state[key];
    }
    
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        this.subscribers.get(key).push(callback);
        
        // 購読解除関数を返す
        return () => {
            const keySubscribers = this.subscribers.get(key) || [];
            const index = keySubscribers.indexOf(callback);
            if (index > -1) {
                keySubscribers.splice(index, 1);
            }
        };
    }
    
    reset() {
        this.state = {};
        this.subscribers.clear();
    }
}

/**
 * コンポーネント検証システム
 */
class ComponentValidator {
    validateComponent(component) {
        const errors = [];
        
        // 要素の存在確認
        if (!component.element) {
            errors.push(`Element not found: ${component.config.selector}`);
        }
        
        // 必須メソッドの確認
        const requiredMethods = ['show', 'hide'];
        for (const method of requiredMethods) {
            if (component.config.methods && !component.config.methods[method]) {
                // 警告レベル
                console.warn(`[ComponentValidator] Missing recommended method: ${method} in ${component.name}`);
            }
        }
        
        // イベントハンドラの確認
        if (component.config.events) {
            for (const [eventSelector, methodName] of Object.entries(component.config.events)) {
                if (!component.config.methods || !component.config.methods[methodName]) {
                    errors.push(`Event handler method not found: ${methodName} for ${eventSelector}`);
                }
            }
        }
        
        if (errors.length > 0) {
            console.error(`[ComponentValidator] Validation failed for ${component.name}:`, errors);
            return false;
        }
        
        console.log(`[ComponentValidator] ✓ Component validated: ${component.name}`);
        return true;
    }
}

// グローバルインスタンス
window.componentManager = new UIComponentManager();