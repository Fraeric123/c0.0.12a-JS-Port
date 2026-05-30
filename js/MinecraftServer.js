export class User {
    constructor(name) {
        this.name = name;
    }
}

export class ServerClient {
    constructor(server, connectionId, connection) {
        this.server = server;
        this.id = connectionId;
        this.connection = connection;
    }

    command(cmd, remaining, dataView, offset) {

    }

    handleException(error) {
        console.error(`[Server] Chyba u klienta ${this.id}:`, error);
        this.disconnect();
    }

    disconnect() {
        this.server.disconnect(this);
        if (this.connection && typeof this.connection.close === 'function') {
            this.connection.close();
        }
    }

    sendPacket(arrayBuffer) {
        if (this.connection) {

            if (typeof this.connection.send === 'function') {
                this.connection.send(arrayBuffer);
            } else if (typeof this.connection.sendToClient === 'function') {
                this.connection.sendToClient(arrayBuffer);
            }
        }
    }
}

export class MinecraftServer {
    constructor() {
        this.clientMap = new Map();
        this.clients = [];
        this.isRunning = false;
        this.tickInterval = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("[Server] Server byl spuštěn.");

        this.tickInterval = setInterval(() => {
            this.tick();
        }, 5);
    }

    stop() {
        this.isRunning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        console.log("[Server] Server byl zastaven.");
    }

    clientConnected(connectionId, connection) {
        const client = new ServerClient(this, connectionId, connection);
        this.clientMap.set(connectionId, client);
        this.clients.push(client);

        console.log(`[Server] Hráč ${connectionId} se připojil.`);
        return client;
    }

    disconnect(client) {
        if (!client) return;

        console.log(`[Server] Hráč ${client.id} se odpojil.`);
        this.clientMap.delete(client.id);

        const index = this.clients.indexOf(client);
        if (index > -1) {
            this.clients.splice(index, 1);
        }
    }

    clientException(connectionId, error) {
        const client = this.clientMap.get(connectionId);
        if (client) {
            client.handleException(error);
        }
    }

    tick() {

    }

    processIncomingData(connectionId, arrayBuffer) {
        const client = this.clientMap.get(connectionId);
        if (!client) return;

        const view = new DataView(arrayBuffer);
        if (arrayBuffer.byteLength > 0) {
            const cmd = view.getUint8(0);
            const remaining = arrayBuffer.byteLength - 1;

            client.command(cmd, remaining, view, 1);
        }
    }
}