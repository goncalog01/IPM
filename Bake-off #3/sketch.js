// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 53;     // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB
let ourDatabase;


let mouseCoordinates;
let left = true;
let leftKeyboard = [['q','w','e','r','t'],['a','s','d','f','g'],['z','x','c','v','b']];
let rightKeyboard = [['y','u','i','o','p'],['g','h','j','k','l'],['c','v','b','n','m']];
let sug;
let word = "";
let previous = [];
let suggestions;
let dict;
let click;
let swipe;
let tip1,tip2,tip3;

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  
  dict = loadStrings("data/short.txt");
  click = loadSound("data/click.mp3");
  tip1 = loadImage("data/dicaSwipeVertical.png");
  tip2 = loadImage("data/dicaSwipeHorizontal1_.jpg");
  tip3 = loadImage("data/dicaSwipeHorizontal2_.png");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];
  
  drawUserIDScreen();       // draws the user input screen (student number and display size)
  dict.forEach(word => {
        let temp = word.split("\t");
        if (temp[0].length <= 2)
          searchTree.insert(temp[0], null);
        else
          searchTree.insert(temp[0], temp[1]);
    })//TODO isto e letras encavalitadas
  suggestions = [];
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER); 
    textFont("Arial", 16);
    fill(255);
    text(word, width/2, height/2 - 1.65 * PPCM);
    fill(0);
    rect(width / 2 - 2.0 * PPCM, height / 2 - 1.5 * PPCM, 4.0 * PPCM, 0.5 * PPCM);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    noStroke();
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);

    drawKeyboard();       // draws our basic 2D keyboard UI
    
    suggestions = searchTree.keysWithPrefix(word).slice(0,3);
    writeSuggestions();

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function drawKeyboard()
{
  push()
  
  textAlign(CENTER,CENTER);
  if (left)
    drawLeft();
  else
    drawRight();
  //SPACE
  //rect(width / 2 - 2 * PPCM, height / 2 - 1.0 * PPCM + 3 * 0.75 * PPCM, 3 * 0.8 * PPCM, 0.75 * PPCM);
  fill(0);
  text("SPACE", width / 2 - 2 * PPCM, height / 2 - 1.0 * PPCM + 3 * 0.75 * PPCM, 3 * 0.8 * PPCM, 0.75 * PPCM);
  //DELETE
  //rect(width / 2 - 2 * PPCM + 3 * 0.8 * PPCM, height / 2 - 1.0 * PPCM + 3 * 0.75 * PPCM, 2 * 0.8 * PPCM, 0.75 * PPCM);
  fill(0);
  text("DEL",width / 2 - 2 * PPCM + 3 * 0.8 * PPCM, height / 2 - 1.0 * PPCM + 3 * 0.75 * PPCM, 2 * 0.8 * PPCM, 0.75 * PPCM);
  
  pop();
}

// Evoked when the mouse button was released
function mousePressed() {
  mouseCoordinates = [mouseX, mouseY];
}

// Evoked when the mouse button was released
function mouseReleased()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {                   
    // Check if mouse click happened within the touch input area
    if(mousePressedWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
    { 
      if (isSwipe()) {
        if (isHorizontalSwipe())
          left = !left;
        else if ((sug = isVerticalSwipe())) {
          if (suggestions[sug-1] != undefined) {
            currently_typed = currently_typed.substring(0, currently_typed.length - word.length);
            word = suggestions[sug-1];
            currently_typed = currently_typed.concat(word);
            if(click.isPlaying())
              click.stop();
            click.play();
          }
        }
      }
      //CLICK
      else {
        checkClick();
        if(click.isPlaying())
          click.stop();
        click.play();
      }
    }
    
    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    else if (mousePressedWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];  
        
        word = "";
        previous = [];
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 200);
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  
  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;
  
  word = "";
  previous = [];
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;      
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  } else {
        if (attempt === 0) {
            firebase.initializeApp(ourFirebaseConfig);
            ourDatabase = firebase.database();
        }

        let our_db_ref = ourDatabase.ref("3a iter");
        our_db_ref.push(attempt_data);

    }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);
  
  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);
    
  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}

function drawLeft() {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < leftKeyboard[i].length; j++) {
      //rect(width / 2 - 2 * PPCM + j * 0.8 * PPCM, height / 2 - 1.0 * PPCM + i * 0.75 * PPCM, 0.8 * PPCM, 0.75 * PPCM);
      push();
      fill(0);
      text(leftKeyboard[i][j], width / 2 - 2 * PPCM + j * 0.8 * PPCM, height / 2 - 1.0 * PPCM + i * 0.75 * PPCM, 0.8 * PPCM, 0.75 * PPCM);
      pop();
    }
  }
}

function drawRight() {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < rightKeyboard[i].length; j++) {
      //rect(width / 2 - 2 * PPCM + j * 0.8 * PPCM, height / 2 - 1.0 * PPCM + i * 0.75 * PPCM, 0.8 * PPCM, 0.75 * PPCM);
      push();
      fill(0);
      text(rightKeyboard[i][j], width / 2 - 2 * PPCM + j * 0.8 * PPCM, height / 2 - 1.0 * PPCM + i * 0.75 * PPCM, 0.8 * PPCM, 0.75 * PPCM);
      pop();
    }
  }
}

function isSwipe() {
    return Math.abs(mouseX - mouseCoordinates[0]) > 25 || Math.abs(mouseY - mouseCoordinates[1]) > 25;
}

function isVerticalSwipe() {
  if (Math.abs(mouseX - mouseCoordinates[0]) < Math.abs(mouseY - mouseCoordinates[1])) {
    if ((mouseCoordinates[0] > (width / 2 - 2.0 * PPCM)) && (mouseCoordinates[0] < (width / 2 - 2.0 * PPCM + 1.333 * PPCM))) {
      return 1
    } else if ((mouseCoordinates[0] > (width / 2 - 2.0 * PPCM + 1.333 * PPCM)) && (mouseCoordinates[0] < (width / 2 - 2.0 * PPCM + 2 * 1.333 * PPCM))) {
      return 2
    } else if ((mouseCoordinates[0] > (width / 2 - 2.0 * PPCM + 2 * 1.333 * PPCM)) && (mouseCoordinates[0] < (width / 2 - 2.0 * PPCM + 3 * 1.333 * PPCM))) {
      return 3
    }
  }
  return 0;
}

function isHorizontalSwipe() {
  return !isVerticalSwipe();
}

function checkKeyLeft() {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < leftKeyboard[i].length; j++) {
      if (mousePressedWithin(width / 2 - 2 * PPCM + j * 0.8 * PPCM, height / 2 - 1.0 * PPCM + i * 0.75 * PPCM, 0.8 * PPCM, 0.75 * PPCM))
        return leftKeyboard[i][j];
    }
  }
  return "";
}

function checkKeyRight() {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < rightKeyboard[i].length; j++) {
      if (mousePressedWithin(width / 2 - 2 * PPCM + j * 0.8 * PPCM, height / 2 - 1.0 * PPCM + i * 0.75 * PPCM, 0.8 * PPCM, 0.75 * PPCM))
        return rightKeyboard[i][j];
    }
  }
  return "";
}

function checkClick() {
  if (left) {
    let letter = checkKeyLeft();
    word += letter;
    currently_typed += letter;
  }
  else {
    let letter = checkKeyRight();
    word += letter;
    currently_typed += letter; 
  }
  //SPACE
  if (mousePressedWithin(width / 2 - 2 * PPCM, height / 2 - 1.0 * PPCM + 3 * 0.75 * PPCM, 3 * 0.8 * PPCM, 0.75 * PPCM)) {
    previous.push(word);
    currently_typed += " ";
    word = "";
  }
  //DELETE
  else if (mousePressedWithin(width / 2 - 2 * PPCM + 3 * 0.8 * PPCM, height / 2 - 1.0 * PPCM + 3 * 0.75 * PPCM, 2 * 0.8 * PPCM, 0.75 * PPCM)) {
    let temp;
    if (currently_typed.length > 0) {
      currently_typed = currently_typed.substring(0, currently_typed.length - 1);
    }
    if (word.length > 0)
      word = word.substring(0, word.length - 1);
    else {
      temp = previous.pop();
      if (temp != undefined)
        word = temp;
    }
  }
}

function writeSuggestions() {
  push();
  textFont("Arial", 13);
  fill(255)
  textAlign(LEFT, CENTER); //len max == 5
  let suggestion = suggestions[0] != undefined ? suggestions[0] : "";
  if (suggestion.length > 7) suggestion = "..".concat(suggestion.substring(suggestion.length - 7));
  text(suggestion, width / 2 - 2.0 * PPCM, height / 2 - 1.5 * PPCM + 0.25 * PPCM);
  suggestion = suggestions[1] != undefined ? suggestions[1] : "";
  if (suggestion.length > 7) suggestion = "..".concat(suggestion.substring(suggestion.length - 7));
  text(suggestion, width / 2 - 2.0 * PPCM + 1.333 * PPCM, height / 2 - 1.5 * PPCM + 0.25 * PPCM);
  suggestion = suggestions[2] != undefined ? suggestions[2] : "";
  if (suggestion.length > 7) suggestion = "..".concat(suggestion.substring(suggestion.length - 7));
  text(suggestion, width / 2 - 2.0 * PPCM + 2 * 1.333 * PPCM, height / 2 - 1.5 * PPCM + 0.25 * PPCM);
  pop();
}

function mousePressedWithin(x, y, w, h) {
  return (mouseCoordinates[0] > x && mouseCoordinates[0] < x + w && mouseCoordinates[1] > y && mouseCoordinates[1] < y + h);
}
