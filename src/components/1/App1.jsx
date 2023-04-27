import { AppContext } from "../../App";
import React, { useContext, useEffect, useRef, useState } from "react";


const App1 = () => {
    const [rawData, setRawData] = useState()

    const RichardElectric = useContext(AppContext).RichardElectric
    const id = useRef('')
    useEffect(() => {
        const model = RichardElectric.getObjectData('pqXHfR', setRawData)
        id.current = model.id
        
        return () => RichardElectric.app.destroySessionObject(id.current)
    })
    return ( <p>App1</p> );
}
 
export default App1;