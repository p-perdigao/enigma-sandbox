import enigma from 'enigma.js'
import schema from 'enigma.js/schemas/12.1657.0.json'


class EnigmaService {
    constructor(appName, appId){
        this.global = null
        this.appName = appName
        this.appId = appId
        this.app = null
    }

    static createInstance(appName, appId) {
        return new EnigmaService(appName, appId)
    }

    static async getQSCHeaders() {
        const response = await fetch(`${import.meta.env.VITE_QLIK_URL}/api/v1/csrf-token`, {
            credentials: 'include',
            headers: { 'qlik-web-integration-id': import.meta.env.VITE_WEB_INTEGRATION_ID },
            redirect: 'follow'
        })

        if( response.status === 401 ) {
            const loginUrl = new URL(`${import.meta.env.VITE_QLIK_URL}/login`);
            loginUrl.searchParams.append('returnto', window.location.href);
            loginUrl.searchParams.append('qlik-web-integration-id', import.meta.env.VITE_WEB_INTEGRATION_ID);
            window.location.href = loginUrl;
            return undefined;
        }

        const csrfToken = new Map(response.headers).get('qlik-csrf-token');
        return {
            'qlik-web-integration-id': import.meta.env.VITE_WEB_INTEGRATION_ID,
            'qlik-csrf-token': csrfToken
        }
    }

    async init() {
        // console.log("Creating Session...", this.appName)
        return EnigmaService.getQSCHeaders()
            .then((headers) => this.getEnigmaGlobal(headers))
            .then(() => this.openApp())
            .then(() => this)
    }

    async getEnigmaGlobal(headers) {
        const params = Object.keys(headers)
            .map((key) => `${key}=${headers[key]}`)
            .join('&');
        const webSocketHost = import.meta.env.VITE_QLIK_URL.replace(/^https?:\/\//, '').replace(/\/?/, '');
        const session = enigma.create({
            schema,
            url: `wss://${webSocketHost}/app/${this.appId}?${params}`,
            createSocket: url => new WebSocket(url)
        })
        // session.on('opened', () => console.log('Conexão aberta', this.appName))
        // session.on('closed', () => console.log('Conexão fechada', this.appName))
        // session.on('suspended', (evt) => console.log('Conexão suspensa', evt, this.appName))
        // session.on('resumed', () => console.log('Conexão resumida', this.appName))
        // session.on('traffic:sent', data => console.log('sent:', data, this.appName));
        // session.on('traffic:received', data => console.log('received:', data, this.appName));
        // session.on('notification:*', (eventName, data) => console.log(eventName, data, this.appName));

        // console.log("Session Created. Opening...", this.appName)
        const global = await session.open()
        this.global = global
        return global
    }

    async openApp() {
        try {
            this.app = await this.global.openDoc(this.appId)   
        } catch (error) {
            console.error('Erro ao abrir o app', this.appName, error)
        }
        return this.app
    }

    async getData(defs, callback) {
        try {
            const model = await this.app.createSessionObject(defs)

            if( callback ) {
                model.on('changed', callback)
                await callback(model)
            }
    
            return model            
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
        }
    }

    async getObjectData(id) {
        const model = await this.app.getObject(id)
        const bind = model.on('changed', () => model.getProperties())
        const props = await model.getProperties()
        console.log(props)
        console.log(bind)
        return model
    }
}

export default EnigmaService