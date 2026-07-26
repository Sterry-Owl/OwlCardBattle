/**
 * 介面渲染與互動模組 (UIManager)
 * 專責處理 DOM 操作、8x8 棋盤渲染與拖曳事件 (Drag and Drop)
 */
export class UIManager {
    /**
     * @param {Object} elements - DOM 節點參考
     * @param {Object} callbacks - 使用者操作的回呼函式
     */
    constructor(elements, callbacks = {}) {
        this.boardElement = elements.board;
        this.handContainer = elements.hand;
        this.apDisplay = elements.apDisplay;
        
        this.callbacks = {
            onCardDropped: callbacks.onCardDropped || (() => {}),
            onCellClicked: callbacks.onCellClicked || (() => {})
        };

        this.draggedCardId = null;
    }

    /**
     * 初始渲染 8x8 棋盤網格，並綁定拖放事件
     */
    renderBoard() {
        this.boardElement.innerHTML = ''; // 清空現有網格

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = document.createElement('div');
                cell.classList.add('board-cell');
                cell.dataset.x = x;
                cell.dataset.y = y;

                // 綁定網格點擊事件 (預留給棋子移動與攻擊)
                cell.addEventListener('click', () => {
                    this.callbacks.onCellClicked({ x, y });
                });

                // 綁定拖曳經過事件 (必須取消預設行為才能觸發 drop)
                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    cell.classList.add('drag-over');
                });

                // 綁定拖曳離開事件 (清除視覺回饋)
                cell.addEventListener('dragleave', () => {
                    cell.classList.remove('drag-over');
                });

                // 綁定放置事件
                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    cell.classList.remove('drag-over');
                    
                    const cardId = e.dataTransfer.getData('text/plain');
                    if (cardId) {
                        this.callbacks.onCardDropped({
                            cardId: cardId,
                            targetX: parseInt(x, 10),
                            targetY: parseInt(y, 10)
                        });
                    }
                });

                this.boardElement.appendChild(cell);
            }
        }
    }

    /**
     * 更新手牌畫面
     * @param {Array} cards - 卡牌資料陣列 { id, name, type, currentCD }
     */
    renderHand(cards) {
        this.handContainer.innerHTML = ''; // 清空現有手牌

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('card');
            
            // 根據 CD 決定是否可拖曳
            if (card.currentCD <= 0) {
                cardEl.draggable = true;
                
                // 拖曳開始
                cardEl.addEventListener('dragstart', (e) => {
                    cardEl.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', card.id);
                });

                // 拖曳結束
                cardEl.addEventListener('dragend', () => {
                    cardEl.classList.remove('dragging');
                });
            } else {
                cardEl.draggable = false;
                cardEl.classList.add('on-cooldown');
            }

            // 組合卡牌內部 DOM (防範 XSS 攻擊，避免使用 innerHTML 寫入不可信資料)
            const titleEl = document.createElement('div');
            titleEl.textContent = card.name;
            
            const cdEl = document.createElement('div');
            cdEl.textContent = card.currentCD > 0 ? `CD: ${card.currentCD}` : '可使用';

            cardEl.appendChild(titleEl);
            cardEl.appendChild(cdEl);
            
            this.handContainer.appendChild(cardEl);
        });
    }

    /**
     * 更新行動點數顯示
     * @param {number} currentAP - 當前 AP
     * @param {number} maxAP - 最大 AP
     */
    updateAP(currentAP, maxAP = 3) {
        this.apDisplay.textContent = `行動點數 (AP): ${currentAP} / ${maxAP}`;
    }
}
