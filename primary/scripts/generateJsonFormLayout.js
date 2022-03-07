const utilities = require('@firstteam102/scoutradioz-utilities');
const readline = require('readline');

let tier = process.argv[2];
let orgkey = process.argv[3];

if (!tier || !orgkey) {
	console.log('Usage: node generateJsonFormLayout.js <database tier> <org key>');
	process.exit(1);
}

process.env.TIER = tier;
utilities.config(require('../databases.json'), {
	cache: {
		enable: false,
	},
	debug: false,
});

utilities.refreshTier();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function prompt(question) {
	return new Promise((resolve, reject) => {
		rl.question(question, answer => {
			resolve(answer);
		});
	});
}

// type, id, label, multiselectOptions, [sliderMin, sliderMax, sliderStep]
const matchAthenian2022 = [
	['h2', 'autoLabel', 'Autonomous'],
	['checkbox', 'didTaxi', 'Did they taxi (move out from the tarmac)?'],
	['h3', 'lblAutoUpperHub', 'Upper Hub'],
	['counter', 'autoHighScored', 'Cargo scored by robot'],
	['badcounter', 'autoHighMissed', 'Cargo missed by robot'],
	['h3', 'lblAutoLowerHub', 'Lower Hub'],
	['counter', 'autoLowScored', 'Cargo scored by robot'],
	['badcounter', 'autoLowMissed', 'Cargo missed by robot'],
	['checkbox', 'autoHumanMadeShot', 'Did the human player score? (Only check this if the human player is from Team {{team_number}}!)'],
	['textblock', 'autoDescription', 'Auto description'],
	['spacer'],
	['h2', 'teleopLabel', 'Teleop'],
	['h3', 'lblTeleUpperHub', 'Upper Hub'],
	['counter', 'teleopHighScored', 'Cargo scored'],
	['badcounter', 'teleopHighMissed', 'Cargo missed'],
	['h3', 'lblTeleLowerHub', 'Lower Hub'],
	['counter', 'teleopLowScored', 'Cargo scored'],
	['badcounter', 'teleopLowMissed', 'Cargo missed'],
	['checkbox', 'defensePlayed', 'Defended (stopped or delayed at least one score)?'],
	['checkbox', 'counterDefensePlayed', 'Attempted to stop or deflect a defender?'],
	['spacer'],
	['h2', 'endgameLabel', 'End game'],
	['multiselect', 'climb', 'Climb', ['None', 'Low', 'Mid', 'High', 'Traversal']],
	['spacer'],
	['h2', 'generalLabel', 'General'],
	// ['slider', 'shooterConsistency', 'Shooter consistency', null, [1, 10, 1]],
	['slider', 'agilityOnField', 'Agility on the field', null, [1, 5, 1]],
	['checkbox', 'diedOnField', 'Died on field'],
	['spacer'],
	['textblock', 'otherNotes', 'Other comments and notes:'],
];
const pitAthenian2022 = [
	['h2', 'robotLabel', 'Robot construction'],
	['multiselect', 'drivetrainType', 'Drivetrain Type', ['Swerve', 'Tank', 'West Coast', 'Other']],
	['textblock', 'drivetrainDescription', 'Describe their drivetrain:'],
	['textblock', 'shooterDescription', 'Describe their shooter (High/Low, Single Flywheel/Double Flywheel/Manipulator, Turret Yes/No, Hood Angle):'],
	['textblock', 'intakeDescription', 'Describe their method of cargo intake (Over The Bumper Yes/No, Flywheels Yes/No, etc.):'],
	['spacer'],
	['h2', 'autoLabel', 'Gameplay'],
	['textblock', 'climberDescription', 'Describe their climbing method:'],
	['multiselect', 'theoreticalClimb', 'Theoretical Max Climb', ['0', 'Low', 'Mid', 'High', 'Traversal']],
	['textblock', 'autoPlan', 'Describe their plan for autonomous:'],
	['spacer'],
	['textblock', 'other', 'Other'],
];

// type, id, label, multiselectOptions, [sliderMin, sliderMax, sliderStep]
const matchGearheads2022 = [
	['h2', 'lblAuto', 'Autonomous'],
	['checkbox', 'didTaxi', 'Did they taxi (move out from the tarmac)?'],
	['h3', 'lblAutoUpperHub', 'Upper Hub'],
	['counter', 'autoHighScored', 'Cargo scored by robot'],
	['badcounter', 'autoHighMissed', 'Cargo missed by robot'],
	['h3', 'lblAutoLowerHub', 'Lower Hub'],
	['counter', 'autoLowScored', 'Cargo scored by robot'],
	['badcounter', 'autoLowMissed', 'Cargo missed by robot'],
	['checkbox', 'autoHumanMadeShot', 'Did the human player score? (Only check this if the human player is from Team {{team_number}}!)'],
	['spacer'],
	['h2', 'teleopLabel', 'Teleop'],
	['h3', 'lblTeleUpperHub', 'Upper Hub'],
	['counter', 'teleopHighScored', 'Cargo scored'],
	['badcounter', 'teleopHighMissed', 'Cargo missed'],
	['h3', 'lblTeleLowerHub', 'Lower Hub'],
	['counter', 'teleopLowScored', 'Cargo scored'],
	['badcounter', 'teleopLowMissed', 'Cargo missed'],
	['spacer'],
	['h2', 'endgameLabel', 'End game'],
	['multiselect', 'successfulClimb', 'Successful climb level:', ['None', 'Low', 'Mid', 'High', 'Traversal']],
	['multiselect', 'attemptedClimb', 'Attempted climb level:', ['None', 'Low', 'Mid', 'High', 'Traversal']],
	['slider', 'climbTimeSeconds', 'Approximately how long did it take them to climb? (seconds)', null, [10, 90, 10]],
	['spacer'],
	['h2', 'generalLabel', 'General'],
	['checkbox', 'defended', 'Defended (stopped or delayed at least one score)?'],
	['checkbox', 'playedCounterDefense', 'Attempted to stop or deflect a defender?'],
	['checkbox', 'diedDuringMatch', 'Died during the match (or never started)?'],
	['checkbox', 'recoveredFromFreeze', 'Recovered from freeze?'],
	['spacer'],
	['checkbox', 'outstandingPerformance', 'Outstanding performance? (If so, definitely explain why!)'],
	['textblock', 'otherNotes', 'Other comments and notes:'],
];

const pitGearheads2022 = [
	['h2', 'lblRobotConstruction', 'Robot construction'],
	['textblock', 'driveTrain', 'Describe the robot\'s drive train:'],
	['spacer'],
	// ['h2', 'lblControls', 'Controls'],
	// ['multiselect', 'controls', 'What kind of controls does the driver use?', ['Game controller (Xbox/PS4/etc.)', 'One joystick', 'Two joysticks', 'Other']],
	// ['textblock', 'controlNotes', 'Other info: Any special notes on driving? Are there operator controls? What does the operator use? Etc.'],
	['h2', 'lblAuto', 'Autonomous period'],
	['checkbox', 'doAuto', 'Can they move during the autonomous period?'],
	['slider', 'autoHowManyCargo', 'How many cargo can they shoot during autonomous?', null, [0, 5, 1]],
	['spacer'],
	['h2', 'lblCargo', 'Teleop period'],
	['checkbox', 'doAutoCodeTeleop', 'Do they use any autonomous/assisting code during the match?'],
	['textblock', 'autoCodeTeleopNotes', 'If so, describe how auto/assisting code is used:'],
	['spacer'],
	['checkbox', 'canPickGround', 'Can they pick up cargo from the ground?'],
	['checkbox', 'canPickStation', 'Can they pick up cargo from the Human Player station?'],
	['checkbox', 'canShootLow', 'Can they score cargo in the lower hub?'],
	['checkbox', 'canShootHigh', 'Can they score cargo in the upper hub?'],
	['spacer'],
	['h2', 'lblClimb', 'Climb'],
	['checkbox', 'canClimbLow', 'Can they climb to the Low bar?'],
	['checkbox', 'canClimbMid', 'Can they climb to the Mid bar?'],
	['checkbox', 'canClimbHigh', 'Can they climb to the High bar?'],
	['checkbox', 'canClimbTraversal', 'Can they climb to the Traversal bar?'],
	['textblock', 'climbNotes', 'Describe the robot\'s climb mechanism/strategy:'],
	['spacer'],
	['textblock', 'preferredStrategy', 'What is their preferred strategy?'],
];

const autoAccuracy2022 = {
	order: 510,
	label: 'Autonomous accuracy',
	id: 'autoAccuracy',
	operations: [
		{
			operator: 'sum',
			operands: ['autoLowScored', 'autoLowMissed', 'autoHighScored', 'autoHighMissed'],
			as: 'totalShots',	// "as" lets you use it as a $variable later down the calculation chain
		}, {
			operator: 'sum',
			operands: ['autoLowScored', 'autoHighScored'],
			as: 'successes',
		}, {
			operator: 'divide',
			operands: ['$successes', '$totalShots']
		}
	],
	display_percentage: true,
};
const teleopAccuracy2022 = {
	order: 515,
	label: 'Teleop accuracy',
	id: 'teleopAccuracy',
	operations: [
		{
			operator: 'sum',
			operands: ['teleopLowScored', 'teleopLowMissed', 'teleopHighScored', 'teleopHighMissed'],
			as: 'totalShots',
		}, {
			operator: 'sum',
			operands: ['teleopLowScored', 'teleopHighScored'],
			as: 'successes',
		}, {
			operator: 'divide',
			operands: ['$successes', '$totalShots'] 
		}
	],
	display_percentage: true,
};
const lowerHubAccuracy2022 = {
	order: 520,
	label: 'Lower Hub accuracy',
	id: 'lowerAccuracy',
	operations: [
		{
			operator: 'sum',
			operands: ['autoLowScored', 'autoLowMissed', 'teleopLowScored', 'teleopLowMissed'],
			as: 'totalShots',
		}, {
			operator: 'sum',
			operands: ['autoLowScored', 'teleopLowScored'],
			as: 'successes',
		}, {
			operator: 'divide',
			operands: ['$successes', '$totalShots']
		}
	],
	display_percentage: true,
};
const upperHubAccuracy2022 = {
	order: 525,
	label: 'Upper Hub accuracy',
	id: 'upperAccuracy',
	operations: [
		{
			operator: 'sum',
			operands: ['autoHighScored', 'autoHighMissed', 'teleopHighScored', 'teleopHighMissed'],
			as: 'totalShots',
		}, {
			operator: 'sum',
			operands: ['autoHighScored', 'teleopHighScored'],
			as: 'successes',
		}, {
			operator: 'divide',
			operands: ['$successes', '$totalShots']
		}
	],
	display_percentage: true,
};
const cargoAccuracy2022 = {
	order: 530,
	label: 'Overall Cargo accuracy',
	id: 'cargoAccuracy',
	operations: [
		{
			operator: 'sum',
			operands: ['teleopLowScored', 'teleopLowMissed', 'teleopHighScored', 'teleopHighMissed', 'autoLowScored', 'autoLowMissed', 'autoHighScored', 'autoHighMissed'],
			as: 'totalShots',
		}, {
			operator: 'sum',
			operands: ['teleopLowScored', 'teleopHighScored', 'autoLowScored', 'teleopLowScored'],
			as: 'successes',
		}, {
			operator: 'divide',
			operands: ['$successes', '$totalShots'] 
		}
	]
};
const ratioUpperLower2022 = {
	order: 540,
	label: 'Percentage: Upper Hub attempts',
	id: 'upperHubPercentage',
	operations: [
		{
			operator: 'sum',
			operands: ['autoHighScored', 'autoHighMissed', 'teleopHighScored', 'teleopHighMissed', 'autoLowScored', 'autoLowMissed', 'teleopLowScored', 'teleopLowMissed'],
			as: 'allShots',
		}, {
			operator: 'sum',
			operands: ['autoHighScored', 'autoHighMissed', 'teleopHighScored', 'teleopHighMissed'],
			as: 'highShots',
		}, {
			operator: 'divide',
			operands: ['$highShots', '$allShots'],
		}
	]
};
const autoPoints2022 = {
	order: 550,
	label: 'Autonomous points',
	id: 'autoPoints',
	operations: [
		{
			operator: 'multiply',
			operands: ['didTaxi', 2],
			as: 'taxi'
		}, {
			operator: 'multiply',
			operands: ['autoHighScored', 4],
			as: 'autoHigh'
		}, {
			operator: 'multiply',
			operands: ['autoLowScored', 2],
			as: 'autoLow'
		}, {
			operator: 'sum',
			operands: ['$taxi', '$autoHigh', '$autoLow']
		}
	],
};
const teleopPoints2022 = {
	order: 555,
	label: 'Teleop points',
	id: 'teleopPoints',
	operations: [
		{
			operator: 'multiply',
			operands: ['teleopHighScored', 2],
			as: 'teleopHigh'
		}, {
			operator: 'multiply',
			operands: ['teleopLowScored', 1],
			as: 'teleopLow'
		}, {
			operator: 'multiselect',
			id: 'climb',
			quantifiers: {
				'None': 0,
				'Low': 4,
				'Mid': 6,
				'High': 10,
				'Traversal': 15,
			},
			as: 'climbPoints'
		}, {
			operator: 'sum',
			operands: ['$teleopHigh', '$teleopLow', '$climbPoints']
		}
	],
};
const contributedPoints2022 = {
	order: 560,
	label: 'Total contributed points',
	id: 'contributedPoints',
	operations: [
		{
			operator: 'multiply',
			operands: ['didTaxi', 2],
			as: 'taxi'
		}, {
			operator: 'multiply',
			operands: ['autoHighScored', 4],
			as: 'autoHigh'
		}, {
			operator: 'multiply',
			operands: ['autoLowScored', 2],
			as: 'autoLow'
		}, {
			operator: 'multiply',
			operands: ['teleopHighScored', 2],
			as: 'teleopHigh'
		}, {
			operator: 'multiply',
			operands: ['teleopLowScored', 1],
			as: 'teleopLow'
		}, {
			operator: 'multiselect',
			id: 'climb',
			quantifiers: {
				'None': 0,
				'Low': 4,
				'Mid': 6,
				'High': 10,
				'Traversal': 15,
			},
			as: 'climbPoints'
		}, {
			operator: 'sum',
			operands: ['$taxi', '$autoHigh', '$autoLow', '$teleopHigh', '$teleopLow', '$climbPoints']
		}
	],
};

const matchDerivedAthenian2022 = [
	{
		order: 499,
		label: 'Climb points',
		id: 'climbPoints',
		operations: [{
			operator: 'multiselect',
			id: 'climb',
			quantifiers: {
				'None': 0,
				'Low': 4,
				'Mid': 6,
				'High': 10,
				'Traversal': 15,
			}
		}]
	}, 
	autoAccuracy2022, 
	teleopAccuracy2022, 
	upperHubAccuracy2022, 
	lowerHubAccuracy2022,
	ratioUpperLower2022,
	cargoAccuracy2022,
	contributedPoints2022, 
	autoPoints2022, 
	teleopPoints2022 
];
// x 0 , 0 = nan 
// x default to first value dropdown
// x Upper and Lower accuracy, overall accuracy
// % time upper vs lower (attempts)
// Auto points, Teleop points

const matchDerivedGearheads2022 = [
	{
		order: 499,
		label: 'Climb points',
		id: 'climbPoints',
		operations: [{
			operator: 'multiselect',
			id: 'successfulClimb',
			quantifiers: {
				'None': 0,
				'Low': 4,
				'Mid': 6,
				'High': 10,
				'Traversal': 15,
			}
		}]
	}, 
	autoAccuracy2022, 
	teleopAccuracy2022,
	upperHubAccuracy2022,
	lowerHubAccuracy2022,
	{
		order: 570,
		label: 'Climb accuracy',
		id: 'climbAccuracy',
		operations: [
			{
				operator: 'multiselect',
				id: 'successfulClimb',
				quantifiers: {
					'None': 0,
					'Low': 1,
					'Mid': 2,
					'High': 3,
					'Traversal': 4,
				},
				as: 'climbSuccess'
			}, {
				operator: 'multiselect',
				id: 'attemptedClimb',
				quantifiers: {
					'None': 0,
					'Low': 1,
					'Mid': 2,
					'High': 3,
					'Traversal': 4,
				},
				as: 'climbAttempt'
			}, {
				operator: 'divide',
				operands: ['$climbSuccess', '$climbAttempt']
				/* 	Attempt 4, get 4 -> 100%
					Attempt 4, get 3 -> (4 - 1) / 4 = 3/4 = 75% - (4 - (4 - 3)) / 4
					Attempt 3, get 1 -> (3 - 2) / 3 = 1/3 = 33% - (3 - (3 - 1)) / 3
					Attempt 2, get 1 -> (2 - 1) / 2 = 1/2 = 50%
					oh, it's literally just success / attempt (note: need to add an exception for div by 0)
				*/
			}
		],
		display_percentage: true,
	}, autoPoints2022, teleopPoints2022, contributedPoints2022, 
];

const year = 2022;
const org_key = orgkey;

let layoutArr = [];

function fixArray(arr, derived, formType) {
	let ret = [];
	for (let i = 0; i < arr.length; i++) {
		let item = arr[i];
		let order = (i * 10);
		let type = item[0];
		let id = item[1];
		let label = item[2];
		let options = item[3];
		let slider = item[4];
		let newItem = {
			year: year,
			order: order,
			type: type,
		};
		if (label) newItem.label = label;
		if (options) newItem.options = options;
		if (id) newItem.id = id;
		if (slider) {
			newItem.options = {
				min: slider[0],
				max: slider[1],
				step: slider[2],
			};
		}
		newItem.form_type = formType;
		newItem.org_key = org_key;
		ret.push(newItem);
	}
	for (let i = 0; i < derived.length; i++) {
		let item = derived[i];
		let newItem = {
			year: year,
			order: item.order,
			type: 'derived',
			operations: item.operations,
			display_percentage: !!item.display_percentage, // TODO: Display percentages as percentages
			label: item.label,
			id: item.id,
			form_type: formType,
			org_key: org_key
		};
		ret.push(newItem);
	}
	return ret;
}

main();

async function main() {
	
	if (org_key === 'frc852')
		layoutArr = [...fixArray(matchAthenian2022, matchDerivedAthenian2022, 'matchscouting'), ...fixArray(pitAthenian2022, [], 'pitscouting')];
	else if (org_key === 'frc102' || org_key === 'demo')
		layoutArr = [...fixArray(matchGearheads2022, matchDerivedGearheads2022, 'matchscouting'), ...fixArray(pitGearheads2022, [], 'pitscouting')];
	else {
		console.log('Sorry, not supported yet');
		process.exit(1);
	}
	
	let existing = await utilities.find('layout', {org_key: org_key, year: year});
	let proceed, writeResult;
	
	if (existing.length == 0) {
		console.log(`No entries found in database for org_key ${org_key} year ${year}.`);
	}
	else {
		console.log(`${existing.length} entries found in database for org_key ${org_key} year ${year}.`);
		proceed = (await prompt(`Delete ${existing.length} entries? [DATABASE TIER: ${process.env.TIER}] [y/N] `)).toLowerCase().startsWith('y');
		
		if (proceed) {
			console.log('Deleting entries...');
			writeResult = await utilities.remove('layout', {org_key: org_key, year: year});
			console.log(`Done, nRemoved = ${writeResult.removedCount}`);
			
		}
	}
	
	console.log(`${layoutArr.length} new items to add for org_key ${org_key} year ${year}.`);
	proceed = (await prompt(`Insert ${layoutArr.length} entries? [y/N] `)).toLowerCase().startsWith('y');
	
	if (proceed) {
		writeResult = await utilities.insert('layout', layoutArr);
		console.log(`${writeResult.nInserted || writeResult.insertedCount} items inserted.`);
	}
	
	rl.close();
	process.exit(0);
}