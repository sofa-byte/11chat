// Define the stages with increasing difficulty
const stages = [
  { combination: ['1', '0', '1', '0'], hint: 'Hint: Try alternating the values.' },
  { combination: ['0', '1', '1', '0', '1'], hint: 'Hint: The sum of all digits is an odd number.' },
  { combination: ['1', '0', '1', '1', '0', '1'], hint: 'Hint: Three 1’s are in odd positions.' },
  { combination: ['0', '1', '0', '1', '0', '1', '0'], hint: 'Hint: Think of a wave pattern, like up and down.' }
];

let currentStage = 0;

// Initialize the first stage
initStage(currentStage);

// Initialize the current stage
function initStage(stageIndex) {
  const stage = stages[stageIndex];
  const stageContainer = document.getElementById('stageContainer');
  
  // Clear previous stage elements
  stageContainer.innerHTML = '';

  // Create the box container for this stage
  const boxContainer = document.createElement('div');
  boxContainer.classList.add('box-container');
  
  // Create the toggle boxes based on the current stage's combination length
  stage.combination.forEach(() => {
    const box = document.createElement('div');
    box.classList.add('toggle-box');
    box.textContent = '0'; // All boxes start with '0'
    box.onclick = function() { toggleValue(box); };
    boxContainer.appendChild(box);
  });

  // Add the box container to the stage container
  stageContainer.appendChild(boxContainer);
}

function toggleValue(element) {
  // Toggle the value of the clicked box
  const value = element.textContent.trim();
  element.textContent = (value === '1') ? '0' : '1';

  // Check if the combination is correct
  checkCombination();
}

function checkCombination() {
  const boxes = document.querySelectorAll('.toggle-box');
  let currentCombination = [];

  // Collect the current state of the boxes
  boxes.forEach(box => currentCombination.push(box.textContent.trim()));

  // Check if the current combination matches the stage's combination
  if (JSON.stringify(currentCombination) === JSON.stringify(stages[currentStage].combination)) {
    document.getElementById('hintButton').classList.remove('hidden');
    document.getElementById('nextStageButton').classList.remove('hidden');
  } else {
    document.getElementById('hintButton').classList.add('hidden');
    document.getElementById('nextStageButton').classList.add('hidden');
    document.getElementById('hint').classList.add('hidden');
  }
}

function showHint() {
  // Show the hint for the current stage
  document.getElementById('hint').textContent = stages[currentStage].hint;
  document.getElementById('hint').classList.remove('hidden');
}

function nextStage() {
  currentStage++;

  if (currentStage < stages.length) {
    initStage(currentStage);
    document.getElementById('hint').classList.add('hidden');
    document.getElementById('hintButton').classList.add('hidden');
    document.getElementById('nextStageButton').classList.add('hidden');
  } else {
    // Game finished
    document.getElementById('stageContainer').innerHTML = '🎉 Congratulations!
    You completed all stages!';
    document.getElementById('hintButton').classList.add('hidden');
    document.getElementById('nextStageButton').classList.add('hidden');
  }
}
