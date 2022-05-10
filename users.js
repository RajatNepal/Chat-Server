const Room = require("./rooms.js");
const banned_words = ["fuck", "shit", "bitch", "cunt", "dick", "ass"];

module.exports = function User(username,io,socket,io_sockets){
    this.username = username;
    this.io = io; //io object
    this.socket = socket; //Socket is the individual socket object which represents our connection to this specific users client
    this.socketio_id = socket.id;
    this.io_sockets = io_sockets; //This is just the io.socket object. We need to have access to its configuration in chat-server.js within each object
                                    //This represents all the socket objects of all connected clients.
    this.current_room = null;
    this.owned_rooms = [];

    this.send_message_to_room = function (msg) {

        if (this.current_room == null){
            io.to(this.socketio_id).emit("usage_message", { "message":'You need to join a room before sending a message'});
            io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message":'You need to join a room before sending a message', "private": true});

        }
        else if (banned_words.some(v => msg.toLowerCase().includes(v))) {
            io.to(this.socketio_id).emit("message_to_client", { "user": "Censored!!", "message": "Watch what you say to the server! Keep fowl Language in the dms please. You Sent: '" + msg+ "' which has a bad word. This message was not sent.", "private": true });
        }
        else if (msg.charAt(0) == '/'){
            //maybe put all of this in a function so it is easier to read
            io.to(this.socketio_id).emit("message_to_client", { "user": username, "message": "(Private Command) "+msg, "private": true }); // broadcast the message to the user who sent it, just so they can see it also

            if (msg == "/help"){
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "use backslashes (/) to issue commands. Use '/commands' to view commands.", "private": true });
            }
            else if (msg == "/commands"){
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Currently supported commands: /help, /about, /commands, /leave, /join, and /joke", "private": true });
            }
            else if (msg == "/about"){
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "This chat room website was made by Anton and Rajat with the help of Socket.io for CSE330S at WashU. You can join rooms, leave rooms, kick mean users, or event ban them if they are super mean.", "private": true });
            }
            else if (msg == "/leave"){
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "In order to leave this room, click the 'Leave Room' button next to this chat's name on the right side of the page.", "private": true });
            }
            else if (msg == "/join"){
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "In order to join a new room, click the 'Join Room' button next to the room you want to join on the right side of the page.", "private": true });
            }
           
            
            else if (msg == "/joke"){
    
                let max = 10;
                let randNum = Math.floor(Math.random() * max);
    
                if(randNum == 0){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "What's the best thing about Switzerland? I don't know, but the flag is a big plus.", "private": true });
                }
                else if(randNum == 1){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "I invented a new word!\nPlagiarism!", "private": true });
                }
                else if(randNum == 2){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.", "private": true });
                }
                else if(randNum == 3){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Hear about the new restaurant called Karma? There's no menu: You get what you deserve.", "private": true });
                }
                else if(randNum == 4){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Did you hear about the actor who fell through the floorboards? He was just going through a stage.", "private": true });
                }
                else if(randNum == 5){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Did you hear about the claustrophobic astronaut? He just needed a little space.", "private": true });
                }
                else if(randNum == 6){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Why don't scientists trust atoms? Because they make up everything.", "private": true });
                }
                else if(randNum == 7){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Where are average things manufactured? The satisfactory.", "private": true });
                }
                else if(randNum == 8){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "How do you drown a hipster? Throw him in the mainstream.", "private": true });
                }
                else if(randNum == 9){
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "What sits at the bottom of the sea and twitches? A nervous wreck.", "private": true });
                }
    
            }
            else{
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "The " + msg + " command is not supported. use '/commands' to view supported commands.", "private": true });

            }
            
        }

        else {
            console.log("user: "+this.username+" message: " + msg+" in room: "+this.current_room.roomname); // log it to the Node.JS output

            //Would want a room.get users to only broadcast this to the users in the room
            // io.sockets.emit("message_to_client", { "user": username, "message": msg }); // broadcast the message to other users

            io.in(this.current_room.roomname).emit("message_to_client", { "user": username, "message": msg });
            //io_sockets.emit("message_to_client", { "user": username, "message": msg }); // broadcast the message to other users
        }
    }

    this.send_message_to_target = function (target_user, msg){


        if (this.current_room == null){
            io.to(this.socketio_id).emit("usage_message", { "message":'You need to join a room before sending a message'});
            io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message":'You need to join a room before sending a message', "private": true});

        }
       
        else {
            console.log("user: "+this.username+" private message to "+target_user.username+": " + msg); // log it to the Node.JS output

            io.to(target_user.socketio_id).emit("message_to_client", { "user": username, "message": "(Private to "+target_user.username+") "+msg , "private":true});

            io.to(this.socketio_id).emit("message_to_client", { "user": username, "message": "(Private to "+target_user.username+") "+msg, "private": true }); // broadcast the message to the user who sent it, just so they can see it also
        }
    }

    this.create_room = function (room_name, private, password = ""){

        //rooms already exist in socket.io
        //rooms don't need to be manually created. They're automatically created when you join.
        
        console.log("Room added: " + room_name);

        //Should create a Room object

        let room = new Room(room_name, private);

        if (private) {
            room.set_password(password);
        }
     

        //Map room name to object in the global array

        
        this.owned_rooms.push(room); //currently an array of room objects

        rooms[room_name] = room; //Adds roomname and object into global map

        this.join_room(room, password); //temporarily "". We create a new room in socketio by just joining it.

    }

    this.join_room = function (room, input_password="") {
        //Join socketio id to room name
        
        //console.log(users);

        if (room.private){
            if (!room.check_banned(this)){ //Check if the user is banned from this room before joining.
                if (room.verify(input_password)){
                    console.log('made it into private join room');
                    socket.join(room.roomname);
                    this.current_room = room;
                    //"this" has different behavior in js functions
                    //testing to make sure its referring to the current user object by doing:

                    room.users_in_room.push(this);

                    this.send_message_to_room("[Has joined private room: "+this.current_room.roomname+"]");
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Welcome to "+ this.current_room.roomname+ ". Use '/help' for help and '/commands' to view commands.", "private": true });

                    //Let the client know that it has sucessfully joined the room, so that it can properly update its current_room tracker
                    io.to(this.socketio_id).emit('join_room_success', {"room_name":this.current_room.roomname});
                }
                else {
                    io.to(this.socketio_id).emit("usage_message", {"message":"Wrong password, try again."})
                    io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message":"Wrong password, try again.", "private": true});

                }
            }
            else {
                io.to(this.socketio_id).emit("usage_message", {"message":"You're banned from this room you toxic piece of !@#$%."});
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message":"You're banned from this room you toxic piece of !@#$%.", "private": true});

            }
        }
        else {
            console.log("is banned "+room.check_banned(this));

            if (!room.check_banned(this)){
                socket.join(room.roomname);
                room.users_in_room.push(this);
                this.current_room = room;
    
                this.send_message_to_room("[Has joined "+this.current_room.roomname+"]");
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message": "Welcome to "+ this.current_room.roomname+ ". Use '/help' for help and '/commands' to view commands.", "private": true });


                //Let the client know that it has sucessfully joined the room, so that it can properly update its current_room tracker
                io.to(this.socketio_id).emit('join_room_success', {"room_name":this.current_room.roomname});
            }
            else {
                io.to(this.socketio_id).emit("usage_message", {"message":"You're banned from this room you toxic piece of !@#$%."});
                io.to(this.socketio_id).emit("message_to_client", { "user": "help_bot", "message":"You're banned from this room you toxic piece of !@#$%.", "private": true});

            }

        }

    }

    this.leave_room = function (){
        console.log("user: "+this.username+" just left room object: "+this.current_room.roomname);

        this.send_message_to_room("[Has left "+this.current_room.roomname+"]"); //Notifies other uses in room that this user has left
        socket.leave(this.current_room.roomname);

        //Updating the list of users in the room object
        for (let i = 0; i< this.current_room.users_in_room.length; i++){
            if (this.current_room.users_in_room[i] === this){
                //Found the user

                this.current_room.users_in_room.splice(i,1); 
                //Basically removes one item at index 1, decreases users array size appropriatley.
            }
        }
        this.current_room = null;
    }

    this.kick_target = function (target, room) {
        console.log("Admin: "+this.username+" has kicked "+target.username+" from room "+room.roomname);

        target.leave_room();
        //Force the target to leave the room

        room.banned_users.push(target);
        //Add user to list of bans from room

        io.to(target.socketio_id).emit("client_kicked_from_room", {});
        //Notifying the client that it has been kicked, so that it can update it's tracking of current_room


        setTimeout(() => {
            //Removing the user from the list of this rooms bans
            for (let i = 0; i< room.banned_users.length; i++){
                if (room.banned_users[i] === target){
                    room.banned_users.splice(i,1); 
                }
            }
            console.log('unbanned!');
        },
        10000); //From node js

    }

    this.ban_target = function (target, room) {
        console.log("Admin: "+this.username+" has banned "+target.username+" from room "+room.roomname);

        target.leave_room();
        //Force the target to leave the room

        room.banned_users.push(target);
        //Add user to list of bans from room

        io.to(target.socketio_id).emit("client_kicked_from_room", {});
        //Notifying the client that it has been banned, so that it can update it's tracking of current_room

    }
}
