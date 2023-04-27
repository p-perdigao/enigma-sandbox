import './App.css'
import EnigmaService from './Qlik/EnigmaService'
import React, { useEffect, useState, createContext } from 'react'
import App1 from './components/1/App1'
import App2 from './components/2/App2'
import App3 from './components/3/App3'

const appList = {
    RichardElectric: '05d07da6-a123-4865-8093-6ffefd2873bf',
    ConsumerSales: 'b480f0b3-e12f-47a4-b175-e62a46a0a2a7',
    InsuranceClaims: 'c3f3df0b-cfc5-4b27-9187-642ee043a121'
}

export const AppContext = createContext()

const App = () => {
    const [enigmaInitialized, setEnigmaInitialized] = useState(false)
    const [context, setContext] = useState([])
    
    useEffect(() => {
        const instances = []
        for (const [appName, appId] of Object.entries(appList)) {
            instances.push(EnigmaService.createInstance( appName, appId ))
        }
        Promise.all(instances.map(instance => instance.init())).then( instances => {
            const context = {}
            instances.forEach((inst) => {
                context[inst.appName] = inst
            })
            setEnigmaInitialized(true)
            setContext(context)
        })
    }, [])
    
    if(enigmaInitialized) {
        return (
            <AppContext.Provider value = {context}>
                <div>
                    {/* <App1 /> */}
                    <App2 />
                    {/* <App3 /> */}
                </div>
            </AppContext.Provider>
        )
    } else {
        return <p>Carregando</p>
    }
    
}

export default App
