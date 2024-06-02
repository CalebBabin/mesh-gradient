import { useEffect, useMemo, useState } from 'react'


function FullscreenButton({ hide = false }) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, []);

    return <button
        style={{ opacity: hide ? 0 : 1 }}
        className='absolute top-2 right-2 p-2 hover:text-white text-black transition-opacity duration-500'
        onClick={() => {
            if (isFullscreen) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }}>
        {isFullscreen ? 'exit fullscreen' : 'fullscreen'}
    </button>

}

function App() {
    const [hideUI, setHideUI] = useState(false);

    useMemo(()=>{
        if (hideUI) document.body.style.cursor = 'none';
        else document.body.style.cursor = '';
    }, [hideUI]);

    useEffect(() => {
        const onInteraction = () => {
            setHideUI(false);
            clearTimeout(window.hideUI);
            window.hideUI = setTimeout(() => {
                setHideUI(true);
            }, 1000);
        };
        document.addEventListener('pointermove', onInteraction);
        return () => {
            document.removeEventListener('pointermove', onInteraction);
        };
    }, []);

    return (
        <>
            <FullscreenButton hide={hideUI} />
        </>
    )
}

export default App
