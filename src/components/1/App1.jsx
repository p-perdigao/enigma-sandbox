import { AppContext } from "../../App";
import React, { useContext, useEffect, useRef } from "react";


const App1 = () => {
    const RichardElectric = useContext(AppContext).RichardElectric
    const id = useRef('')
    useEffect(() => {
        const model = RichardElectric.getObjectDefs('pqXHfR')
        id.current = model.id
        
        return () => RichardElectric.app.destroySessionObject(id.current)
    })
    return ( <p>App1</p> );
}
 
export default App1;