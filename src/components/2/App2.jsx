import { AppContext } from "../../App";
import React, { useContext, useEffect, useRef, useState } from "react";
import hipercubo2 from './hypercube2.json'


const App2 = () => {
    const [rawData, setRawData] = useState()
    const ConsumerSales = useContext(AppContext).ConsumerSales
    const id = useRef('')
    
    console.log('render', rawData)
    
    useEffect(() => {
        const model = ConsumerSales.getData(hipercubo2, setData)
        id.current = model.id
        
        return () => ConsumerSales.app.destroySessionObject(id.current)
    }, [hipercubo2])

    const setData = (data) => {
        setRawData(data)
    }

    if (!rawData) return <p>Carregando</p>
    return ( <p>App2</p> );
}
 
export default App2;