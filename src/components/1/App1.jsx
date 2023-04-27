import { AppContext } from "../../App";
import React, { useContext, useEffect, useRef, useState } from "react";


const App1 = () => {
    const objId = 'pqXHfR'
    const [rawData, setRawData] = useState()
    const RichardElectric = useContext(AppContext).RichardElectric
    const id = useRef('')
    
    useEffect(() => {
        const model = RichardElectric.getObjectData(objId, setData)
        id.current = model.id
        
        return () => RichardElectric.app.destroySessionObject(id.current)
    }, [objId])

    const setData = (data) => {
        setRawData(data)
    }

    if (!rawData) return <p>Carregando</p>
    return ( <p>App1</p> );
}
 
export default App1;