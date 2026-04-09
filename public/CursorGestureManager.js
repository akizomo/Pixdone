// CursorGestureManager.js
// タップ・スワイプ・ドラッグ&ドロップを明確に区別する再利用可能なクラス

const TAP_DISTANCE = 10; // px
const TAP_TIME = 400;    // ms

class CursorGestureManager {
    constructor(target, handlers = {}) {
        this.target = target;
        this.handlers = handlers;
        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.isDragging = false;
        this.isSwiping = false;
        this.isTapping = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.touchMoved = false;
        this._preventClick = false;

        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onClick = this._onClick.bind(this);

        this.addListeners();
    }

    addListeners() {
        this.target.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.target.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.target.addEventListener('touchend', this._onTouchEnd, { passive: false });
        this.target.addEventListener('click', this._onClick, true);
    }

    removeListeners() {
        this.target.removeEventListener('touchstart', this._onTouchStart);
        this.target.removeEventListener('touchmove', this._onTouchMove);
        this.target.removeEventListener('touchend', this._onTouchEnd);
        this.target.removeEventListener('click', this._onClick, true);
    }

    _onTouchStart(e) {
        if (e.touches.length > 1) return;

        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.lastTouchX = this.startX;
        this.lastTouchY = this.startY;
        this.startTime = Date.now();

        this.isDragging = false;
        this.isSwiping = false;
        this.isTapping = true;
        this.touchMoved = false;
        this._preventClick = false;

        this._longPressTimer = setTimeout(() => {
            // 長押しは必ずドラッグ扱いにする
            if (!this.isDragging && !this.isSwiping) {
                this.isDragging = true;
                this.isTapping = false;
                if (this.handlers.onDragStart) {
                    this.handlers.onDragStart({ x: this.startX, y: this.startY, e });
                }
            }
        }, 300);
    }

    _onTouchMove(e) {
        if (e.touches.length > 1) return;

        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = x - this.startX;
        const dy = y - this.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        this.lastTouchX = x;
        this.lastTouchY = y;
        this.touchMoved = true;

        if (!this.isDragging && !this.isSwiping) {
            // スワイプ判定（横30px以上、縦20px未満）
            if (absDx > 30 && absDy < 20) {
                clearTimeout(this._longPressTimer);
                this.isSwiping = true;
                this.isTapping = false;
                if (this.handlers.onSwipe) {
                    this.handlers.onSwipe({ dx, dy, direction: dx > 0 ? 'right' : 'left', e });
                }
                return;
            }

            // ドラッグ判定（20px以上移動）
            if (absDx > 20 || absDy > 20) {
                clearTimeout(this._longPressTimer);
                this.isDragging = true;
                this.isTapping = false;
                if (this.handlers.onDragStart) {
                    this.handlers.onDragStart({ x: this.startX, y: this.startY, e });
                }
            }
        }

        if (this.isDragging) {
            e.preventDefault();
            if (this.handlers.onDragMove) {
                this.handlers.onDragMove({ x, y, dx, dy, e });
            }
        }
    }

    _onTouchEnd(e) {
        clearTimeout(this._longPressTimer);

        const endX = this.lastTouchX;
        const endY = this.lastTouchY;
        const dx = endX - this.startX;
        const dy = endY - this.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const duration = Date.now() - this.startTime;

        if (this.isDragging) {
            if (this.handlers.onDragEnd) {
                this.handlers.onDragEnd({ x: endX, y: endY, dx, dy, e });
            }
            this._preventClick = true;
        }
        else if (this.isSwiping) {
            this._preventClick = true;
        }
        // ドラッグ・スワイプでない場合だけタップ判定
        else if (this.isTapping && !this.isDragging && !this.isSwiping) {
            if (absDx <= TAP_DISTANCE && absDy <= TAP_DISTANCE && duration <= TAP_TIME) {
                if (this.handlers.onTap) {
                    this.handlers.onTap({ x: endX, y: endY, e });
                }
                this._preventClick = true;
            }
        }

        // 状態リセット
        this.isDragging = false;
        this.isSwiping = false;
        this.isTapping = false;
        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.touchMoved = false;
    }

    _onClick(e) {
        if (this._preventClick) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this._preventClick = false;
        }
    }
}

export default CursorGestureManager; 