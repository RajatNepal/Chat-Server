module.exports = function Room (roomname, private){
    this.roomname = roomname; //This will match socketios roomname
    this.users_in_room = [];
    this.private = private;
    this.password = ""; //this will be set later if necessarry
    this.banned_users = [];

    this.check_banned = function (user) {
        for (i = 0; i<this.banned_users.length;i++){
            if (user === this.banned_users[i]){
                return true;
            }
        }
        return false;
    }

    this.verify = function (input_password) {
        console.log(input_password);
        console.log(this.password);
        //Change this to be more secure later
        if (input_password != this.password){
            return false;
        }
        else {
            return true;
        }
    }

    this.set_password = function (password){
        this.password =password;
    }
}