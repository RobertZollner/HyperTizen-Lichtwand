let client;
let deviceIP;
const RPC_SERVER = 'ws://192.168.178.93:8090/';

const events = {
    SetConfig: 0,
    ReadConfig: 1,
    ReadConfigResult: 2
};

function send(json) {
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(json));
    }
}

function setStatus(text, good) {
    const el = document.getElementById('status');
    el.innerText = text;
    el.className = good ? 'good' : 'bad';
}

function openConnection() {
    client = new WebSocket(`ws://${deviceIP}:8086`);

    client.onopen = function () {
        setStatus('HyperTizen verbunden', true);
        document.getElementById('server').innerText = RPC_SERVER;

        // SSDP bewusst umgehen: HyperHDR-Adresse direkt setzen.
        send({ event: events.SetConfig, key: 'rpcServer', value: RPC_SERVER });

        // Direkt aktivieren.
        setTimeout(() => {
            send({ event: events.SetConfig, key: 'enabled', value: 'true' });
            send({ event: events.ReadConfig, key: 'rpcServer' });
            send({ event: events.ReadConfig, key: 'enabled' });
        }, 300);
    };

    client.onmessage = function (data) {
        const msg = JSON.parse(data.data);
        if (msg.Event === events.ReadConfigResult) {
            if (msg.key === 'rpcServer' && !msg.error) {
                document.getElementById('server').innerText = msg.value;
            }
            if (msg.key === 'enabled' && !msg.error) {
                const enabled = msg.value === 'true';
                document.getElementById('enabledState').innerText = enabled ? 'AN' : 'AUS';
                document.getElementById('enabledState').className = enabled ? 'good' : 'bad';
            }
        }
    };

    client.onerror = function () {
        setStatus('Verbindung zum HyperTizen-Dienst fehlgeschlagen', false);
    };

    client.onclose = function () {
        setStatus('HyperTizen-Dienst getrennt', false);
    };
}

window.startHyperTizenLichtwand = function () {
    fetch('http://127.0.0.1:8081')
        .then(res => res.text())
        .then(ip => {
            deviceIP = ip.trim();
            openConnection();
        })
        .catch(() => setStatus('TV-IP konnte nicht ermittelt werden', false));
};

window.reconnectHyperHDR = function () {
    send({ event: events.SetConfig, key: 'rpcServer', value: RPC_SERVER });
    setTimeout(() => {
        send({ event: events.SetConfig, key: 'enabled', value: 'true' });
        send({ event: events.ReadConfig, key: 'rpcServer' });
        send({ event: events.ReadConfig, key: 'enabled' });
    }, 250);
};
