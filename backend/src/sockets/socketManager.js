let io = null;

const setIO = (socketIO) => { 
    io = socketIO;
};

const getIO = () => {
    if(!io)  throw new Error("Socket.io is not initialized");
    return io;
};

module.exports = {
    setIO, getIO
};