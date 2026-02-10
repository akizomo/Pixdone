// 新システムの診断とテスト
function diagnoseNewSystem() {
    console.log('=== New System Diagnostic ===');
    
    // 1. ComponentManagerの存在確認
    if (!window.componentManager) {
        console.error('❌ ComponentManager not available');
        return false;
    }
    
    console.log('✓ ComponentManager available');
    
    // 2. モバイルモーダルコンポーネントの確認
    const mobileModal = window.componentManager.getComponent('mobileModal');
    if (!mobileModal) {
        console.error('❌ Mobile modal component not found');
        return false;
    }
    
    console.log('✓ Mobile modal component found');
    
    // 3. DOM要素の確認
    if (!mobileModal.element) {
        console.error('❌ Mobile modal DOM element not found');
        return false;
    }
    
    console.log('✓ Mobile modal DOM element found');
    
    // 4. メソッドの確認
    const requiredMethods = ['show', 'hide', 'save', 'delete'];
    const missingMethods = requiredMethods.filter(method => !mobileModal.methods[method]);
    
    if (missingMethods.length > 0) {
        console.error('❌ Missing methods:', missingMethods);
        return false;
    }
    
    console.log('✓ All required methods available');
    
    // 5. イベントリスナーの確認
    const eventManager = window.componentManager.eventManager;
    console.log(`✓ Event listeners registered: ${eventManager.listeners.size}`);
    
    return true;
}

// テスト実行
function testNewSystemModal() {
    console.log('=== Testing New System Modal ===');
    
    if (!diagnoseNewSystem()) {
        console.error('❌ System diagnosis failed');
        return;
    }
    
    const mobileModal = window.componentManager.getComponent('mobileModal');
    
    try {
        console.log('Testing modal show...');
        mobileModal.methods.show({ title: 'Test Task' });
        
        // 表示確認
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(mobileModal.element);
            console.log('Modal computed styles after show:', {
                display: computedStyle.display,
                position: computedStyle.position,
                visibility: computedStyle.visibility,
                zIndex: computedStyle.zIndex
            });
            
            // 非表示テスト
            setTimeout(() => {
                console.log('Testing modal hide...');
                mobileModal.methods.hide();
                
                setTimeout(() => {
                    const hiddenStyle = window.getComputedStyle(mobileModal.element);
                    console.log('Modal computed styles after hide:', {
                        display: hiddenStyle.display,
                        visibility: hiddenStyle.visibility
                    });
                }, 100);
            }, 1000);
        }, 100);
        
    } catch (error) {
        console.error('❌ Modal test failed:', error);
    }
}

// 修復機能
function fixNewSystemModal() {
    console.log('=== Fixing New System Modal ===');
    
    const mobileModal = window.componentManager.getComponent('mobileModal');
    if (!mobileModal) {
        console.error('❌ Cannot fix - component not found');
        return;
    }
    
    // 強制的に表示メソッドを改善
    mobileModal.methods.show = function(data = {}) {
        console.log('[MobileModal] Enhanced show method called');
        this.setState({ isOpen: true, currentTask: data });
        
        // 複数のスタイル設定方法を併用
        const styles = {
            display: 'block',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '10000',
            background: '#f5f5f5',
            visibility: 'visible',
            opacity: '1'
        };
        
        // インラインスタイル設定
        Object.assign(this.element.style, styles);
        
        // クラスベースの設定
        this.element.classList.add('modal-force-show');
        
        // タイトル設定
        const titleElement = this.element.querySelector('#mobileModalTitle');
        if (titleElement) {
            titleElement.textContent = data && data.title ? 'Edit Task' : 'Add Task';
        }
        
        // フォーカス設定
        this.focusFirstInput();
        
        console.log('[MobileModal] Enhanced show method completed');
    };
    
    // 強制スタイルをCSSに追加
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .modal-force-show {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 10000 !important;
            background: #f5f5f5 !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(styleSheet);
    
    console.log('✓ Modal system fixed and enhanced');
}

// グローバル関数として追加
window.diagnoseNewSystem = diagnoseNewSystem;
window.testNewSystemModal = testNewSystemModal;
window.fixNewSystemModal = fixNewSystemModal;