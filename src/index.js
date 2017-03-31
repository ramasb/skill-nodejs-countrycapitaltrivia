'use strict';
var Alexa = require("alexa-sdk");
var appId = 'amzn1.ask.skill.5a279ae4-0328-4dd4-8f23-fb75adabf506'; //'amzn1.echo-sdk-ams.app.your-skill-id';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'CountryCapitalSkillTable';
    alexa.registerHandlers(newSessionHandlers, guessModeHandlers, startGameHandlers, guessAttemptHandlers);
    alexa.execute();
};

var states = {
    GUESSMODE: '_GUESSMODE', // User is trying to guess the number.
    STARTMODE: '_STARTMODE'  // Prompt the user to start or restart the game.
};

var newSessionHandlers = {
    'NewSession': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['endedSessionCount'] = 0;
            this.attributes['guessPlayed'] = 0;
            this.attributes['guessWon'] = 0;
        }
        this.handler.state = states.STARTMODE;
        this.emit(':ask', 'Welcome to Country-Capital guessing game. You have played '
            + this.attributes['guessPlayed'].toString() + ' times. would you like to play?',
            'Say yes to start the game or no to quit.');
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        //this.attributes['endedSessionCount'] += 1;
        this.emit(":tell", "Goodbye!");
    }
};

var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        var message = 'I will say a country, please find the capital for that ' +
            ' country. Do you want to start the game?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
    	this.attributes['guessPlayed']++;
    	var country = "India";
    	var capital = "New Delhi";
        this.attributes["country"] = country;
        this.attributes["capital"] = capital;
        this.handler.state = states.GUESSMODE;
        this.emit(':ask', 'Great! ' + 'What is the capital for ' + this.attributes["country"] + '?', 'Capital.');
    },
    'AMAZON.NoIntent': function() {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, see you next time!');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    }
});

var guessModeHandlers = Alexa.CreateStateHandler(states.GUESSMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'CapitalGuessIntent': function() {
        var capital = parseInt(this.event.request.intent.slots.capital);
        var country = this.attributes["country"];
        var oCapital = this.attributes["capital"];
        console.log('user guessed: ' + capital);
        if(capital == oCapital){
            // With a callback, use the arrow function to preserve the correct 'this' context
            this.emit('CapitalRight');
            /*
            this.emit('CapitalRight', () => {
                this.emit(':ask', capital + 'is correct! Would you like to play a new game?',
                'Say yes to start a new game, or no to end the game.');
            });
            */
        } else {
            this.emit('CapitalWrong');
        }
    },
    'CapitalClueIntent': function() {
    	var startLetter = this.attributes["capital"].substring(0,1);
        this.emit(':ask', 'Clue is the capital for ' + this.attributes["country"] + '. Capital starts with letter ' + startLetter, 'Capital.');
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'What is the capital for ' + this.attributes["country"] + '?', 'Capital.');
    },
    
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.emit(':tell', "You have won" + this.attributes['guessWon'] + " out of " + this.attributes['guessPlayed'] + " games played!");  
        this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying the capital again.', 'Try saying a capital.');
    }
});

// These handlers are not bound to a state
var guessAttemptHandlers = {
    'CapitalRight': function() {
    	this.emit(':ask', capital + 'is correct! Would you like to play a new game?',
        'Say yes to start a new game, or no to end the game.');
        this.handler.state = states.STARTMODE;
        this.attributes['guessWon']++;
        //callback();
    },
    'CapitalWrong': function() {
        this.emit(':ask', 'Sorry, wrong answer.', 'Try saying again.');
    },
    'Wrong': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying again.', 'Try saying again.');
    }
};