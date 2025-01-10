// Bakeoff #2 - Seleção de Alvos e Fatores Humanos
// IPM 2020-21, Semestre 2
// Entrega: até dia 7 de Maio às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 3 de Maio

// p5.js reference: https://p5js.org/reference/ 

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 53;      // Add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // Set to 'true' before sharing during the simulation and bake-off days

const borderSize = 3;
const lineSize = 6;

// Target and grid properties (DO NOT CHANGE!)
let PPI, PPCM;
let TARGET_SIZE;
let TARGET_PADDING, MARGIN, LEFT_PADDING, TOP_PADDING; 
let continue_button;
let original_size;

// Metrics
let testStartTime, testEndTime;// time between the start and end of one attempt (48 trials)
let hits 			 = 0;      // number of successful selections
let misses 			 = 0;      // number of missed selections (used to calculate accuracy)
let database;                  // Firebase DB  
let g53database;  

// Study control parameters
let draw_targets     = false;  // used to control what to show in draw()
let trials 			 = [];     // contains the order of targets that activate in the test
let current_trial    = 0;      // the current trial number (indexes into trials array above)
let attempt          = 0;      // users complete each test twice to account for practice (attemps 0 and 1)
let fitts_IDs        = [];     // add the Fitts ID for each selection here (-1 when there is a miss)

let miss;
let hit;
let base;
let vec;
let nextbase;
let nextVec;
let R;

// Target class (position and width)
class Target
{
  constructor(x, y, w)
  {
    this.x = x;
    this.y = y;
    this.w = w;
  }
}

function preload() {
  miss = loadSound('hitmarker.mp3');
  hit = loadSound('sonic_ring.mp3');
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);    // window size in px before we go into fullScreen()
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  
  randomizeTrials();         // randomize the trial order at the start of execution
  
  textFont("Arial", 18);     // font size for the majority of the text
  
  drawUserIDScreen();        // draws the user input screen (student number and display size)
}
// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets)
  {
    // The user is interacting with the 4x4 target grid
    background(color(0,0,0));        // sets background to black
    
    // Print trial count at the top left-corner of the canvas
    fill(color(255,255,255));
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    original_size = textSize();
    
    // Draw all 16 targets
	for (var i = 0; i < 16; i++) drawTarget(i);
    if (trials[current_trial + 1] != undefined && trials[current_trial] != trials[current_trial + 1])
      drawArrow(nextBase, nextVec, color("#FFD700"), R);
    if (trials[current_trial - 1] != undefined && trials[current_trial] != trials[current_trial - 1])
      drawArrow(base, vec, color("#20fc03"), R);
  }
}

// Print and save results at the end of 48 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
  text(timestamp, width/12, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);
  
  // Print Fitts IDS (one per target, -1 if failed selection)
  text("Fitts Index of Performance", width/2, 260)
  print(fitts_IDs);
  text("Target 1: ---", width / 4, 280);
  for(let index = 0; index < 23; index++)
  {
    text(`Target ${index + 2}: ${fitts_IDs[index] >= 0 ? fitts_IDs[index] : "MISSED"}`, width/4, 300 + 20 * index);
    text(`Target ${index + 25}: ${fitts_IDs[index + 23] >= 0 ? fitts_IDs[index + 23] : "MISSED"}`, 3 * width/4, 280 + 20 * index);
  }
  text(`Target ${48}: ${fitts_IDs[46] >= 0 ? fitts_IDs[46] : "MISSED"}`, 3 * width/4, 740);
  
  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,
        fitts_IDs:          fitts_IDs
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
  }
}

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    // Get the location and size of the target the user should be trying to select
    let target = getTargetBounds(trials[current_trial]);
    let next_target = getTargetBounds(trials[current_trial + 1]);
    let fitts_dist = round(Math.log2(dist(next_target.x, next_target.y, mouseX, mouseY) / target.w + 1), 3);
    
    if(!isNaN(fitts_dist))
      fitts_IDs.push(fitts_dist);
    
    // Check to see if the mouse cursor is inside the target bounds,
    // increasing either the 'hits' or 'misses' counters
    if (dist(target.x, target.y, mouseX, mouseY) < target.w/2) {
      hits++;
      
      if (hit.isPlaying()) {
        hit.stop();
      }
      hit.setVolume(0.05);
      hit.play();
    }
    else {
      if(current_trial != 0)
        fitts_IDs[current_trial-1] = -1;
      misses++;
      
      if (miss.isPlaying()) {
        miss.stop();
      }
      miss.setVolume(0.05)
      miss.play();
    }
    
    current_trial++;                 // Move on to the next trial/target
    
    // Check if the user has completed all 48 trials
    if (current_trial === trials.length)
    {
      testEndTime = millis();
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    } 
  }
}

// Draw target on-screen
function drawTarget(i)
{
  // Get the location and size for target (i)
  let target = getTargetBounds(i);
  let c = color(155,155,155);
  let border = c;
  let string = "";
  R = target.w/2

  // Check whether this target is the target the user should be trying to select
  if (trials[current_trial] === i) 
  { 
    // Highlights the target the user should be trying to select
    // with a white border
    c = color("#20fc03");
    border = color(255);
    string = current_trial + 1;
    
    let previous_target = getTargetBounds(trials[current_trial - 1]);
    let next_target = getTargetBounds(trials[current_trial + 1]);

    if (previous_target != undefined) {
      base = createVector(previous_target.x, previous_target.y);
      vec = createVector(target.x-previous_target.x, target.y-previous_target.y);
    }
    if (next_target != undefined) {
      nextBase = createVector(target.x, target.y);
      nextVec = createVector(next_target.x-target.x, next_target.y-target.y);
    }
    
    if (trials[current_trial + 1] != undefined && trials[current_trial] == trials[current_trial + 1]) {
      border = color(255, 0, 0);
      string = "x2";
    }
    
    if (dist(target.x, target.y, mouseX, mouseY) < target.w/2) {
      c = color(255,0,0);
      cursor(HAND);
    }
    else cursor(ARROW);

    // Remember you are allowed to access targets (i-1) and (i+1)
    // if this is the target the user should be trying to select
    //
  } else if (trials[current_trial + 1] != undefined && i == trials[current_trial + 1])
  {
    c = color("#FFD700");
    border = color(0);
    string = current_trial + 2;
  }
  // Does not draw a border if this is not the target the user
  // should be trying to select
  else noStroke();

  // Draws the target
  fill(c);
  stroke(border);
  strokeWeight(borderSize);
  circle(target.x, target.y, target.w);
  noStroke();
  textSize(50)
  fill(0);
  textAlign(CENTER, CENTER);
  text(string, target.x, target.y); //+ center_offset);
  fill(c);
  textSize(original_size);
}

// Returns the location and size of a given target
function getTargetBounds(i)
{
  var x = parseInt(LEFT_PADDING) + parseInt((i % 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);
  var y = parseInt(TOP_PADDING) + parseInt(Math.floor(i / 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);

  return new Target(x, y, TARGET_SIZE);
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  // Re-randomize the trial order
  shuffle(trials, true);
  current_trial = 0;
  print("trial order: " + trials);
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  fitts_IDs = [];
  
  continue_button.remove();
  
  // Shows the targets again
  draw_targets = true;
  testStartTime = millis();  
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
    
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NOT CHANGE THESE!
  PPI            = display.ppi;                        // calculates pixels per inch
  PPCM           = PPI / 2.54;                         // calculates pixels per cm
  TARGET_SIZE    = 1.5 * PPCM;                         // sets the target size in cm, i.e, 1.5cm
  TARGET_PADDING = 1.5 * PPCM;                         // sets the padding around the targets in cm
  MARGIN         = 1.5 * PPCM;                         // sets the margin around the targets in cm

  // Sets the margin of the grid of targets to the left of the canvas (DO NOT CHANGE!)
  LEFT_PADDING   = width/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;        
  
  // Sets the margin of the grid of targets to the top of the canvas (DO NOT CHANGE!)
  TOP_PADDING    = height/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;
  
  // Starts drawing targets immediately after we go fullscreen
  draw_targets = true;
}

function drawArrow(base, vec, myColor, r) {
  push();
  stroke(myColor);
  strokeWeight(lineSize);
  fill(myColor);
  translate(base.x, base.y);
  rotate(vec.heading());
  line(r + borderSize, 0, vec.mag() - r - borderSize, 0);
  let arrowSize = 14;
  translate(vec.mag() - r - borderSize - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}
