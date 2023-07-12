import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import '../App.css';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside" >
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/Code Fusion.png"
                            alt="logo"
                        />
                    </div>
                    <h3 className='h5 mt-2 mb-2'>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btnn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btnn leaveBtnn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <div className='d-flex justify-content-between m-2'>
                    <div className="col-sm-3 w-25" >
                        <label className="visually-hidden" htmlFor="specificSizeSelect">Preference</label>
                        <select className="form-select" id="specificSizeSelect">
                            <option value="default">Choose Language</option>
                            <option value="C">C</option>
                            <option value="Cpp">C++</option>
                            <option value="Java">Java</option>
                            <option value="Python">Python3</option>
                        </select>
                    </div>
                    <div className="col-sm-2 w-25" style={{ marginLeft: "37%"}}>
                        <label className="visually-hidden" htmlFor="specificThemeSelect">Preference</label>
                        <select className="form-select" id="specificThemeSelect">
                            <option >Choose Theme</option>
                            <option value="1">Eclipse</option>
                            <option value="2">Light</option>
                            <option value="3">Mid-Night</option>
                            <option value="4">Ruby-Blue</option>
                        </select>
                    </div>
                    <div>
                        <button type="button" id='run' className='btn btn-success'>Run Code</button>
                    </div>
                </div>
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
            <div className='p-3 mt-4' style={{width: "22%"}}>
                <div className='h-50'>
                    <label htmlFor="Input" className='text-light mb-2 h5'>Input</label>
                    <textarea type="text" id='input' className='form-control h-75' ></textarea>
                </div>
                <div className='h-50'>
                    <label htmlFor="Output" className='text-light mb-2 h5'>Output</label>
                    <textarea  type="text" id='output' className='form-control h-75' ></textarea>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
