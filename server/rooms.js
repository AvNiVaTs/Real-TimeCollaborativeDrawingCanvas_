const connectedUsers = {};

function addUser(id) {
    const user = {
        id: id,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`
    };
    connectedUsers[id] = user;
    return user;
}

function removeUser(id) {
    delete connectedUsers[id];
}

function getUser(id) {
    return connectedUsers[id];
}

function getAllUsers() {
    return connectedUsers;
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getAllUsers
};