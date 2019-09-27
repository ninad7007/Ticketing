var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
var passport=require("passport");
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");

//schema setup
var ticketSchema= new mongoose.Schema({
  name: String,
  cost: Number
});

var boughtSchema = new mongoose.Schema({
    name : String,
    cost : Number,
    units : Number
})


var Ticket=mongoose.model("Ticket",ticketSchema);

var Bought=mongoose.model("Bought",boughtSchema);

var userSchema = new mongoose.Schema({
  username: String,
  password: String,
  tickets: [boughtSchema]
});
userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User",userSchema);




mongoose.connect("mongodb://localhost/tickets", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname+"/public"));

app.use(require("express-session")({
  secret: "I'm building Ticket counter",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use('user-local',new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
  res.locals.currentUser=req.user;
  next();
});



Ticket.remove({},function(err){
  if(err) console.log(err);
  else console.log("removed");
})

Ticket.create(
  {name : "Early Bird" , cost : 800}, function(err,ticket){
    if(err){
      console.log(err);
    }else{
      console.log("Ticket added");
    }
  }
);
Ticket.create(
  {name : "Vip" , cost : 1600}, function(err,ticket){
    if(err){
      console.log(err);
    }else{
      console.log("Ticket added");
    }
  }
);






app.get("/",function(req,res){
  res.render("landing.ejs");
});



app.get("/tickets", isLoggedIn, function(req,res){
    Ticket.find({},function(err,allTickets){
      if(err){
        console.log(err);
      } else{
        res.render("tickets.ejs",{tickets:allTickets});
        // res.render("tickets.ejs");
      }
    })
})

app.get("/ticketbought/:id",function(req,res){
  var id=req.params.id;
  Ticket.findById(id,function(err,tick)
  {
    if(err) console.log(err);
    else{
      Bought.findOne({name : tick.name},function(err,boughttick){
        if(boughttick){
           
          Bought.updateOne({name : tick.name},{name:boughttick.name, cost: boughttick.cost, units: boughttick.units+1},function(err,b){
            if(err) console.log(err);
            else console.log("bought again");
          });

        }
        else{
          Bought.create({name : tick.name, cost : tick.cost, units : 1}, function(err,createdbought){
            if(err) console.log(err);
            else console.log("bought a ticket");
          })
        }
      })
    }
  });
  res.redirect("/");
});

app.get("boughtTicket",function(req,res){
  Bought.find({},function(err,boughtTicks){
    if(err) console.log(err);
    else{
      res.render("boughtTickets.ejs",{boughtTicks:boughtTicks});
    }
  })
  res.render("boughtTickets.ejs",{});
})

app.get("/register",function(req,res){
  res.render("register.ejs");
});

app.post("/register",function(req,res){
  var newUser=new User({username: req.body.username});
  //register this user using passport
  User.register(newUser,req.body.password,function(err,user){
    if(err){
      console.log(err);
      return res.render("register.ejs");
    }
    passport.authenticate("user-local")(req,res,function(){
      res.redirect("/");
    });
  });
});

//login routes
app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.post("/login",passport.authenticate('user-local',{
  successRedirect:"/",
  failureRedirect:"/login"
}), function(req,res){
  res.send("Login logic happes here");
});

//logout routes
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    // alert("Logged in!");
    return next();
  }
  // alert("Logged in");
  res.redirect("/login");
}


app.listen(3000,function(){
  console.log("App running at 3000");
});
