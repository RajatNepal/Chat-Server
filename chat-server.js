// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const User = require("./users.js");



// const { isStringObject } = require("util/types");
//Not sure why this was giving problems ^^^^


const port = 3456;
const main_file = "./client/client.html";
const css_file = "./client/styles.css";

//Global variables for code

global.users = new Object(); //Objects are Hashmaps
global.rooms = new Object();
//So we can only have unique usernames, and unique roomnames


// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, res) {
    // This callback runs when a new connection is made to our HTTP server.

    fs.readFile(main_file, function (err, data) {
        // This callback runs when the client.html file has been read from the filesystem.

        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(port);



// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);


// setInterval(function() {
//     //Cited from:
//     //https://stackoverflow.com/questions/35341696/how-to-convert-map-keys-to-array
//     let rooms_keys = Array.from( Object.keys(rooms) ); //Gets all keys from the room
//     //End of citation

//     //Need to take the existing roomname => rooms hashmap
//     //and create a smaller map which contains, roomname and whether its private or not

//     let name_to_private_map = {};
//     for (let [roomname, room_obj] of Object.entries(rooms)) { //Array destructuring
//         name_to_private_map[roomname] = room_obj.private;
//     }

//     //If they are private, it'll display differently

//     io.sockets.emit("return_rooms_available", {"rooms": name_to_private_map});

// }, 1000);

io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    socket.on('new_user', function (data) {

        //console.log(users);
        //console.log(data["user"]);
        if (users[data["user"]]=== undefined){
            
            let user = new User(data["user"], io, socket, io.sockets);
            users[data["user"]]=user;
            //console.log("success");
            io.to(socket.id).emit("entry_success", { "message":''});
        }
        else {
            //console.log("already exists?");
            io.to(socket.id).emit("usage_message", { "message":'This user already exists. Try a different one nerd!'});
        }

        update_frontend_rooms_lists();
        
    })
    //We can refresh certain things on the client end on a repeating timer

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        //let user = users.get(data["user"]);
        let user =users[data["user"]];

        user.send_message_to_room(data["message"]);

    });

    socket.on('private_message_to_server', function (data) {

        //let user = users.get(data["user"]);
        let user =users[data["user"]];
        //let target_user = users.get(data["target"]);
        let target_user =users[data["target"]];
        user.send_message_to_target( target_user, data["message"]);
    })

    socket.on('create_room', function (data) {

        //let user = users.get(data["user"]);
        let user = users[data["user"]];

        if (rooms[data["room_name"]]=== undefined){

            if (data["private"]){//If its private
                user.create_room(data["room_name"], true, data["password"]); //non-private room
            }
            else {
                user.create_room(data["room_name"], false); //non-private room
                //password parameter is "" by default
            }

            //Only create the room if it doesn't already exist in the map
            //re-creating a room which already exists in the map will re-set the room object
            //Not sure if javascript automatically leaves the original in, or substitues the new map entry????
        }
        else {
            io.to(socket.id).emit("usage_message", { "message":'This room already exists. Try a different one nerd!'});
        }

        update_frontend_users_lists();
        update_frontend_rooms_lists();
    });

    socket.on('join_room', function (data) {

        //let user = users.get(data["user"]);
        let user =users[data["user"]];

        let room = rooms[data["room_name"]]; //Still an actual map for now


        if (user.current_room !== null){
            user.leave_room();
            user.join_room(room, false); //non-private room
            
        }
        else {
            console.log('attempt to join the room');
            user.join_room(room, false); //non-private room
            
        }

        update_frontend_users_lists();
        update_frontend_rooms_lists();

    });

    socket.on('join_private_room', function (data) {

        //let user = users.get(data["user"]);
        let user =users[data["user"]];

        let room = rooms[data["room_name"]]; //Still an actual map for now

        let pass = data["password"];

        //console.log('is it even joining room');

        if (room.verify(pass)){
            if (user.current_room !== null){
                user.leave_room();
                user.join_room(room, pass);
            }
            else {
                user.join_room(room, pass);
                
            }
            update_frontend_users_lists();
            update_frontend_rooms_lists();
        }
        else {
            io.to(socket.id).emit("usage_message", { "message":'Incorrect password for this room.'});
       
        }

        


    });

    socket.on('leave_room', function (data) {
        //let user = users.get(data["user"]);
        let user =users[data["user"]];
        user.leave_room();

        update_frontend_users_lists();
        update_frontend_rooms_lists();
    })

    socket.on('kick_target', function (data) {
        let user =users[data["user"]];
        let target = users[data["target"]];
        //let room = users[data["room"]]; //will be whatever roomm the admin is currently in
        user.kick_target(target, user.current_room);
        //The user object is the admin for this room, so it encapsulates the functionality of banning the other user from this room
        update_frontend_rooms_lists();
        update_frontend_users_lists();

    });

    socket.on('ban_target', function (data) {
        let user =users[data["user"]];
        let target = users[data["target"]];
        //let room = users[data["room"]]; //will be whatever roomm the admin is currently in
        user.ban_target(target, user.current_room);

        update_frontend_rooms_lists();
        update_frontend_users_lists();

    });

    function  update_frontend_users_lists() {

        //The way I have it now,
        //anytime some creates, joins, or leaves a room. It will update all rooms
        //Not the most efficient system
        //but it works better than having it on a timer


        
        for (let [roomname, room_obj] of Object.entries(rooms)) { //Array destructuring
            //console.log(room_obj);
            let users_in_room = room_obj.users_in_room;
    
            let usernames_in_room = [];//Converts array of user objects into array of corresponding usernames
            
            let owner = Object(); //Some user owns this room object
            let func = (element) => { //This lambda function has to be here to capture 'owner' in its scope
                if (element.owned_rooms.includes(room_obj)){
                    owner = element;
                }
                else {
                    usernames_in_room.push(element.username);
                }
            };
            users_in_room.forEach(func);


            //This doesn't take into account users who aren't currently in a room
            //We need to broadcast a special message to the owner's socket,
            //so that owner functionality gets displayed in the owner's client and in no one elses

            //Owners username will always be at the end of the array

            usernames_in_room.push(owner.username);
    
            io.in(roomname).emit("return_users_in_room", {"users":usernames_in_room});
            
            // io.in(roomname).emit("return_users_in_room", {"users":usernames_in_room, "owner":false});
            // //First sends everyone in the room, regardless of ownership, no owner permissions

            // io.to(owner.socketio_id).emit("return_users_in_room", {"users":usernames_in_room, "owner":true});
            // //Then sends the owner a specific emit, which will let it render owner permissions
        }
    
        //Broadcast an empty array to all users who currently aren't in a room
        for (let [username, user_obj] of Object.entries(users)){ //Object entries users returns an iterable for all entries of that object, in this case, all key value pairs
            if (user_obj.current_room === null){
                io.to(user_obj.socketio_id).emit("return_users_in_room",{"users":[]});
            }
        }
    }

    function update_frontend_rooms_lists() {
        //Cited from:
        //https://stackoverflow.com/questions/35341696/how-to-convert-map-keys-to-array
        //let rooms_keys = Array.from( Object.keys(rooms) ); //Gets all keys from the room
        //End of citation
    
        //Need to take the existing roomname => rooms hashmap
        //and create a smaller map which contains, roomname and whether its private or not
    
        let name_to_private_map = {};
        for (let [roomname, room_obj] of Object.entries(rooms)) { //Array destructuring

            console.log("list of users in room");
            for (i = 0; i<room_obj.users_in_room.length;i++){
                console.log(room_obj.users_in_room[i].username);
            }

            name_to_private_map[roomname] = room_obj.private;
        }
    
        //If they are private, it'll display differently
    
        io.sockets.emit("return_rooms_available", {"rooms": name_to_private_map});
    
    }

});


