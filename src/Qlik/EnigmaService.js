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

    async getData(defs, setData) {
        try {
            const model = await this.app.createSessionObject(defs)
            console.log(model)
            const getData = async (model) => {
                try {
                    const qHyperCubeDef = defs.qHyperCubeDef
                    console.log(defs, qHyperCubeDef)
                    const path = '/qHyperCubeDef'
                    
                    const numOfDim = qHyperCubeDef.qDimensions?.length ? qHyperCubeDef.qDimensions?.length : 0
                    const numOfMeasures = qHyperCubeDef.qMeasures?.length ? qHyperCubeDef.qMeasures?.length : 0
                    const hypercubeWidth = numOfDim + numOfMeasures
                    
                    const pages = [{qWidth: hypercubeWidth, qHeight: 10000/hypercubeWidth}]
                    switch(true) {
                        case qHyperCubeDef.qMode === 'S' || qHyperCubeDef.qMode === 'DATA_MODE_STRAIGHT':
                            setData(await model.getHyperCubeData(path, pages))
                            break;
                        case qHyperCubeDef.qMode === 'P' || qHyperCubeDef.qMode === 'DATA_MODE_PIVOT':
                            setData(await model.getHyperCubePivotData(path, pages))
                            break;
                        case qHyperCubeDef.qMode === 'K' || qHyperCubeDef.qMode === 'DATA_MODE_PIVOT_STACK':
                            setData(await model.getHyperCubeStackData(path, pages))
                            break;
                        case qHyperCubeDef.qMode === 'T' || qHyperCubeDef.qMode === 'DATA_MODE_TREE':
                            setData(await model.getHyperCubeTreeData(path))
                            break;
                        case qHyperCubeDef.qMode === 'D' || qHyperCubeDef.qMode === 'DATA_MODE_DYNAMIC':
                            setData(await model.getHyperCubeData(path, pages))
                            break;
                        default:
                            setData(await model.getHyperCubeData(path, pages))
                            break;
                    }
                } catch (error) {
                    console.error(error)
                }
            }
    
            getData(model)
            model.on('changed', () => getData(model)
            )
    
            return model   
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
        }
    }

    async getObjectData(id, setData)  {
        const model = await this.app.getObject(id)
        const getData = async (model) => {
            try {
                const qHyperCubeDef = (await model.getProperties()).qHyperCubeDef
                console.log(qHyperCubeDef)
                const path = '/qHyperCubeDef'
                const hypercubeWidth = qHyperCubeDef?.qDimensions?.length + qHyperCubeDef?.qMeasures?.length
                const pages = [{qWidth: hypercubeWidth, qHeight: 10000/hypercubeWidth}]
    
                switch(true) {
                    case qHyperCubeDef.qMode === 'S' || qHyperCubeDef.qMode === 'DATA_MODE_STRAIGHT':
                        setData(await model.getHyperCubeData(path, pages))
                        break;
                    case qHyperCubeDef.qMode === 'P' || qHyperCubeDef.qMode === 'DATA_MODE_PIVOT':
                        setData(await model.getHyperCubePivotData(path, pages))
                        break;
                    case qHyperCubeDef.qMode === 'K' || qHyperCubeDef.qMode === 'DATA_MODE_PIVOT_STACK':
                        setData(await model.getHyperCubeStackData(path, pages))
                        break;
                    case qHyperCubeDef.qMode === 'T' || qHyperCubeDef.qMode === 'DATA_MODE_TREE':
                        setData(await model.getHyperCubeTreeData(path))
                        break;
                    case qHyperCubeDef.qMode === 'D' || qHyperCubeDef.qMode === 'DATA_MODE_DYNAMIC':
                        setData(await model.getHyperCubeData(path, pages))
                        break;
                }
            } catch (error) {
                console.error(error)
            }
        }

        getData(model)
        model.on('changed', () => getData(model))

        return model
    }
}

export default EnigmaService