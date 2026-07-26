/**
 * 網路連線模組 (基於 PeerJS)
 * 負責處理 P2P 連線的建立、資料傳輸與錯誤處理
 */
export class NetworkManager {

    constructor(callbacks = {}) {
        this.peer = null;
        this.connection = null;
        this.callbacks = {
            onReady: callbacks.onReady || (() => {}),
            onConnected: callbacks.onConnected || (() => {}),
            onDataReceived: callbacks.onDataReceived || (() => {}),
            onError: callbacks.onError || (() => {})
        };
    }

    initializeHost() {
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.callbacks.onReady(id);
        });

        this.peer.on('connection', (conn) => {
            if (this.connection) {
                conn.close();
                return;
            }
            this.connection = conn;
            this._setupConnectionEvents();
        });

        this._setupPeerErrors();
    }

    connectToHost(hostId) {
        if (!hostId || typeof hostId !== 'string') {
            this.callbacks.onError(new Error('無效的房間 ID'));
            return;
        }

        this.peer = new Peer();

        this.peer.on('open', () => {
            this.connection = this.peer.connect(hostId, { reliable: true });
            this._setupConnectionEvents();
        });

        this._setupPeerErrors();
    }

    _setupConnectionEvents() {
        this.connection.on('open', () => {
            this.callbacks.onConnected();
        });

        this.connection.on('data', (data) => {
            this.callbacks.onDataReceived(data);
        });

        this.connection.on('close', () => {
            this.callbacks.onError(new Error('連線已中斷'));
            this.connection = null;
        });

        this.connection.on('error', (err) => {
            this.callbacks.onError(err);
        });
    }

    _setupPeerErrors() {
        this.peer.on('error', (err) => {
            this.callbacks.onError(err);
        });
    }

    sendData(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        } else {
            this.callbacks.onError(new Error('尚未建立連線，無法發送資料'));
        }
    }
}
