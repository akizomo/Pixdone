/**
 * 開発支援ツール
 * Development Support Tools
 */

class DevTools {
    constructor() {
        this.enabled = true;
        this.testSuite = new TestSuite();
        this.debugger = new ComponentDebugger();
        this.monitor = new PerformanceMonitor();
        
        this.init();
    }
    
    init() {
        if (!this.enabled) return;
        
        this.setupConsoleCommands();
        this.setupErrorHandling();
        this.monitor.start();
        
        console.log('[DevTools] Development tools initialized');
    }
    
    setupConsoleCommands() {
        // コンソール用のコマンドを追加
        window.dev = {
            // コンポーネント関連
            components: () => this.listComponents(),
            test: (componentName) => this.testSuite.runTests(componentName),
            debug: (componentName) => this.debugger.debug(componentName),
            
            // 状態管理
            state: () => this.showState(),
            setState: (key, value) => window.componentManager.stateManager.setState(key, value),
            
            // イベント関連
            events: () => this.showEvents(),
            
            // パフォーマンス
            performance: () => this.monitor.getReport(),
            
            // 自動修復
            autofix: () => this.autofix(),
            
            // リセット
            reset: () => this.reset()
        };
        
        console.log('[DevTools] Console commands available: dev.components(), dev.test(), dev.debug(), etc.');
    }
    
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('[DevTools] Global error:', event.error);
            this.handleError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[DevTools] Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }
    
    listComponents() {
        const components = Array.from(window.componentManager.components.keys());
        console.table(components.map(name => {
            const component = window.componentManager.getComponent(name);
            return {
                name,
                element: component.element ? 'Found' : 'Not found',
                state: Object.keys(component.state).length,
                methods: Object.keys(component.methods).length
            };
        }));
    }
    
    showState() {
        const state = window.componentManager.stateManager.state;
        console.log('[DevTools] Current state:', state);
        return state;
    }
    
    showEvents() {
        const eventCount = window.componentManager.eventManager.listeners.size;
        console.log(`[DevTools] Active event listeners: ${eventCount}`);
        
        for (const [id, listener] of window.componentManager.eventManager.listeners) {
            console.log(`ID: ${id}, Element: ${listener.element.tagName}, Event: ${listener.eventType}`);
        }
    }
    
    handleError(error) {
        // 一般的なエラーパターンの自動修復
        if (error.message.includes('Cannot read property') || error.message.includes('Cannot read properties')) {
            this.debugger.diagnoseNullReference(error);
        }
        
        if (error.message.includes('addEventListener')) {
            this.debugger.diagnoseEventError(error);
        }
    }
    
    autofix() {
        console.log('[DevTools] Running autofix...');
        
        // 一般的な問題の自動修復
        this.autoFixMissingElements();
        this.autoFixEventListeners();
        this.autoFixState();
        
        console.log('[DevTools] Autofix completed');
    }
    
    autoFixMissingElements() {
        for (const [name, component] of window.componentManager.components) {
            if (!component.element) {
                console.warn(`[DevTools] Attempting to re-initialize ${name}`);
                component.init();
            }
        }
    }
    
    autoFixEventListeners() {
        // イベントリスナーの重複を確認・修正
        const eventManager = window.componentManager.eventManager;
        const listenerCount = eventManager.listeners.size;
        
        if (listenerCount > 100) {
            console.warn(`[DevTools] High event listener count detected: ${listenerCount}`);
        }
    }
    
    autoFixState() {
        // 状態の整合性チェック
        const stateManager = window.componentManager.stateManager;
        const state = stateManager.state;
        
        for (const [key, value] of Object.entries(state)) {
            if (value === undefined || value === null) {
                console.warn(`[DevTools] Cleaning up null/undefined state: ${key}`);
                delete state[key];
            }
        }
    }
    
    reset() {
        console.log('[DevTools] Resetting all components...');
        
        // 全てのコンポーネントを破棄して再初期化
        window.componentManager.destroy();
        window.componentManager = new UIComponentManager();
        
        console.log('[DevTools] Reset completed');
    }
}

class TestSuite {
    constructor() {
        this.tests = new Map();
        this.setupDefaultTests();
    }
    
    setupDefaultTests() {
        // モバイルモーダルのテスト
        this.addTest('mobileModal', [
            {
                name: 'Element exists',
                test: () => {
                    const component = window.componentManager.getComponent('mobileModal');
                    return component && component.element;
                }
            },
            {
                name: 'Can show modal',
                test: () => {
                    const component = window.componentManager.getComponent('mobileModal');
                    component.methods.show();
                    return component.state.isOpen === true;
                }
            },
            {
                name: 'Can hide modal',
                test: () => {
                    const component = window.componentManager.getComponent('mobileModal');
                    component.methods.hide();
                    return component.state.isOpen === false;
                }
            }
        ]);
        
        // タスクリストのテスト
        this.addTest('taskList', [
            {
                name: 'Element exists',
                test: () => {
                    const component = window.componentManager.getComponent('taskList');
                    return component && component.element;
                }
            },
            {
                name: 'Can add task',
                test: () => {
                    const component = window.componentManager.getComponent('taskList');
                    const initialCount = component.state.tasks.length;
                    component.methods.addTask({ id: 'test', title: 'Test Task' });
                    return component.state.tasks.length === initialCount + 1;
                }
            }
        ]);
    }
    
    addTest(componentName, tests) {
        this.tests.set(componentName, tests);
    }
    
    runTests(componentName) {
        const tests = this.tests.get(componentName);
        if (!tests) {
            console.error(`[TestSuite] No tests found for: ${componentName}`);
            return;
        }
        
        console.log(`[TestSuite] Running tests for: ${componentName}`);
        
        const results = tests.map(test => {
            try {
                const result = test.test();
                console.log(`✓ ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
                return { name: test.name, passed: result };
            } catch (error) {
                console.error(`✗ ${test.name}: ERROR - ${error.message}`);
                return { name: test.name, passed: false, error: error.message };
            }
        });
        
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        console.log(`[TestSuite] Results: ${passed}/${total} tests passed`);
        
        return results;
    }
    
    runAllTests() {
        console.log('[TestSuite] Running all tests...');
        
        for (const [componentName] of this.tests) {
            this.runTests(componentName);
        }
    }
}

class ComponentDebugger {
    debug(componentName) {
        const component = window.componentManager.getComponent(componentName);
        if (!component) {
            console.error(`[ComponentDebugger] Component not found: ${componentName}`);
            return;
        }
        
        console.log(`[ComponentDebugger] Debugging: ${componentName}`);
        console.log('Element:', component.element);
        console.log('State:', component.state);
        console.log('Methods:', Object.keys(component.methods));
        console.log('Config:', component.config);
        
        // 要素の詳細情報
        if (component.element) {
            console.log('Element details:', {
                tagName: component.element.tagName,
                id: component.element.id,
                className: component.element.className,
                style: component.element.style.cssText,
                computedStyle: {
                    display: window.getComputedStyle(component.element).display,
                    visibility: window.getComputedStyle(component.element).visibility,
                    position: window.getComputedStyle(component.element).position
                }
            });
        }
    }
    
    diagnoseNullReference(error) {
        console.log('[ComponentDebugger] Diagnosing null reference error:', error.message);
        
        // スタックトレースから問題のある行を特定
        const stack = error.stack;
        console.log('Stack trace:', stack);
        
        // 一般的な解決策を提案
        console.log('Suggested fixes:');
        console.log('1. Check if element exists before accessing properties');
        console.log('2. Use optional chaining (?.) operator');
        console.log('3. Add null checks in component initialization');
    }
    
    diagnoseEventError(error) {
        console.log('[ComponentDebugger] Diagnosing event error:', error.message);
        
        console.log('Suggested fixes:');
        console.log('1. Ensure element exists before adding event listeners');
        console.log('2. Use the EventManager for automatic cleanup');
        console.log('3. Check for duplicate event listener registration');
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            componentInitTime: {},
            eventListenerCount: 0,
            stateChanges: 0,
            renders: 0
        };
        
        this.startTime = performance.now();
    }
    
    start() {
        // パフォーマンス監視を開始
        this.monitorComponentInit();
        this.monitorEventListeners();
        this.monitorStateChanges();
    }
    
    monitorComponentInit() {
        const originalRegister = window.componentManager.registerComponent;
        
        window.componentManager.registerComponent = (name, config) => {
            const startTime = performance.now();
            const result = originalRegister.call(window.componentManager, name, config);
            const endTime = performance.now();
            
            this.metrics.componentInitTime[name] = endTime - startTime;
            
            return result;
        };
    }
    
    monitorEventListeners() {
        const originalOn = window.componentManager.eventManager.on;
        
        window.componentManager.eventManager.on = (...args) => {
            this.metrics.eventListenerCount++;
            return originalOn.apply(window.componentManager.eventManager, args);
        };
    }
    
    monitorStateChanges() {
        const originalSetState = window.componentManager.stateManager.setState;
        
        window.componentManager.stateManager.setState = (...args) => {
            this.metrics.stateChanges++;
            return originalSetState.apply(window.componentManager.stateManager, args);
        };
    }
    
    getReport() {
        const totalTime = performance.now() - this.startTime;
        
        console.log('[PerformanceMonitor] Performance Report:');
        console.log(`Total runtime: ${totalTime.toFixed(2)}ms`);
        console.log('Component initialization times:', this.metrics.componentInitTime);
        console.log(`Event listeners: ${this.metrics.eventListenerCount}`);
        console.log(`State changes: ${this.metrics.stateChanges}`);
        console.log(`Renders: ${this.metrics.renders}`);
        
        return this.metrics;
    }
}

// 初期化
window.devTools = new DevTools();