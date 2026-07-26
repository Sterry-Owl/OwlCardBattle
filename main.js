import { NetworkManager } from './network.js';
import { UIManager } from './ui.js';
// 預留未來匯入 GameEngine 的空間
// import { GameEngine } from './game.js';

/**
 * 系統初始化與事件綁定
 * 確保 HTML DOM 完全載入後才執行程式
 */
document.addEventListener('DOMContentLoaded', () => {
    // 取得連線大廳與遊戲介面的 DOM 節點
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomId = document.getElementById('input-room-id');
    const roomIdDisplay = document.getElementById('room-id-display');
    const connectionStatus = document.getElementById('connection-status');
    const lobbyContainer = document.getElementById('lobby-container');
    const gameContainer = document.getElementById('game-container');

    // 初始化 UI 模組，傳入所需的 DOM 節點與回呼函式
    const uiManager = new UIManager(
        {
            board: document.getElementById('board'),
            hand: document.getElementById('hand-container'),
            apDisplay: document.getElementById('ap-display')
        },
        {
            onCardDropped: (data) => {
                console.log('使用者拖曳卡牌進場:', data);
                // 預留：在此處呼叫 GameEngine 驗證 AP 與 CD，若成功則發送網路指令
            },
            onCellClicked: (data) => {
                console.log('使用者點擊棋盤網格:', data);
                // 預留：在此處處理棋子選取與移動/攻擊邏輯
            }
        }
    );

    // 初始化網路模組並注入回呼函式 (Dependency Injection)
    const networkManager = new NetworkManager({
        onReady: (id) => {
            roomIdDisplay.textContent = id;
            connectionStatus.textContent = '系統狀態：等待對手加入...';
        },
        onConnected: () => {
            connectionStatus.textContent = '系統狀態：連線成功！遊戲即將開始...';
            
            // 連線成功後，隱藏大廳並顯示遊戲主介面
            lobbyContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            
            // 渲染 8x8 棋盤
            uiManager.renderBoard();
            
            // 測試用假資料：渲染測試手牌以確認樣式與拖曳功能正常
            uiManager.renderHand([
                { id: 'card_1', name: '步兵', currentCD: 0 },
                { id: 'card_2', name: '弓箭手', currentCD: 1 },
                { id: 'card_3', name: '騎兵', currentCD: 0 }
            ]);
            
            // 預留：在此處觸發遊戲初始化邏輯 (GameEngine.start)
        },
        onDataReceived: (data) => {
            console.log('接收到同步資料:', data);
            // 預留：將接收到的指令交給 GameEngine 處理，並通知 UI 更新
        },
        onError: (err) => {
            connectionStatus.textContent = `系統狀態：發生錯誤 (${err.message})`;
            console.error('連線模組錯誤:', err);
            
            // 發生錯誤時恢復按鈕狀態
            btnCreateRoom.disabled = false;
            btnJoinRoom.disabled = false;
        }
    });

    // 綁定「建立房間」按鈕事件 (房主)
    btnCreateRoom.addEventListener('click', () => {
        // 停用按鈕避免重複點擊
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        
        connectionStatus.textContent = '系統狀態：正在建立房間...';
        networkManager.initializeHost();
    });

    // 綁定「加入房間」按鈕事件 (客機)
    btnJoinRoom.addEventListener('click', () => {
        const hostId = inputRoomId.value.trim();
        
        if (!hostId) {
            alert('請輸入有效的房間代碼');
            return;
        }

        // 停用按鈕避免重複點擊
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        
        connectionStatus.textContent = '系統狀態：正在連線至房間...';
        networkManager.connectToHost(hostId);
    });
});
        onDataReceived: (data) => {
            console.log('接收到同步資料:', data);
            // 預留：將接收到的指令交給 GameEngine 處理，並通知 UI 更新
        },
        onError: (err) => {
            connectionStatus.textContent = `系統狀態：發生錯誤 (${err.message})`;
            console.error('連線模組錯誤:', err);
            
            // 發生錯誤時恢復按鈕狀態
            btnCreateRoom.disabled = false;
            btnJoinRoom.disabled = false;
        }
    });

    // 綁定「建立房間」按鈕事件 (房主)
    btnCreateRoom.addEventListener('click', () => {
        // 停用按鈕避免重複點擊
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        
        connectionStatus.textContent = '系統狀態：正在建立房間...';
        networkManager.initializeHost();
    });

    // 綁定「加入房間」按鈕事件 (客機)
    btnJoinRoom.addEventListener('click', () => {
        const hostId = inputRoomId.value.trim();
        
        if (!hostId) {
            alert('請輸入有效的房間代碼');
            return;
        }

        // 停用按鈕避免重複點擊
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        
        connectionStatus.textContent = '系統狀態：正在連線至房間...';
        networkManager.connectToHost(hostId);
    });
});
