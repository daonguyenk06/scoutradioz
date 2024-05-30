import { writable, get as getStore, readable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

import { liveQuery } from 'dexie';
import db, { defaultPreferences, type Preferences } from './localDB';
import { getLogger } from '$lib/logger';
import { browser } from '$app/environment';

const logger = getLogger('lib/stores');

const preferences_store: Writable<Preferences> = writable({ ...defaultPreferences });
export const preferences = {
	...preferences_store,
	set: async (newVal: Preferences) => {
		logger.debug('Updating db.preferences from store set function', newVal);
		
		db.preferences.update(newVal, newVal);
		preferences_store.set(newVal);
	}
};
// Load preferences store
if (browser) db.preferences
	.toCollection()
	.first()
	.then(async (data) => {
		if (!data) {
			logger.info('Preferences item did not exist in the db; inserting one now');
			await db.preferences.add({...defaultPreferences});
			// Grab the new item with the autogenerated primary key
			data = await db.preferences.toCollection().first();
		}
		// Populate an object first with the default values and then overwritten with values saved in the db.
		// 	Doing it this way because if defaultPreferences gets additional values in an app update, we wanna
		// 	make sure they're included when the store is loaded after the app update.
		const ret = {
			...defaultPreferences,
			...data
		};
		logger.debug('Preferences loaded from db', ret);
		preferences_store.set(ret);
	});

/**
 * Whether the device is currently connected to the internet. NOTE: deviceOnline is not a perfect indicator of whether
 * the device has a GOOD connection. It's entirely possible for deviceOnline to be true while they have such a poor
 * connection that it's impossible to load any pages or do any AJAX calls, so DON'T do any blocking AJAX/fetch calls
 * unless the user is clicking something that they are aware will do a call.
 * 
 * Example: Hitting 'done' on a scouting form will save the data locally and mark as completed, but if deviceOnline/
 * canAutoSync is true, it will additionally attempt to send the data to the server in the background. But it must be
 * done in a non-blocking way so that the user isn't stuck and confused why nothing is happening.
 */
export const deviceOnline = readable(
	'navigator' in globalThis && 'onLine' in navigator ? navigator.onLine : false,
	(set) => {
		if ('addEventListener' in globalThis) {
			addEventListener('online', (e) => {
				console.log('Online event', e);
				set(true);
			});
			addEventListener('offline', (e) => {
				console.log('Offline event', e);
				set(false);
			});
		} else
			console.warn(
				'Was unable to add an event listener for deviceOnline. If you see this warning while building/deploying sveltekit or in the nodejs console, everything should be ok, but if you see this in the browser console then the app will not be able to be reactive to the device going online/offline.'
			);
	}
);

/** 
 * Whether Voyager is currently ABLE AND ALLOWED to sync something in the background. 
 * Combination of deviceOnline && preferences.enableAutoSync.
 */
export const canAutoSync = derived([deviceOnline, preferences], ([online, preferences]) => {
	return online && preferences.enableAutoSync;
});

/** 
 * For alert messages, providing a similar functionality to the LEMoN stack's res.redirect('/path?alert=(message)&type=(type)') 
 * 
 * Usage:
 * 
 * 		import 
 */
export const alertStore: Writable<{message: string, type: 'info'|'error'|'success'|'warn'|undefined}|null> = writable(null);

// 2024-01-27 JL: commenting out for now, but i'm pretty sure this won't be needed after
// 	changing the data-loading to be inside +layout.ts

// const userObservable = liveQuery(async () => {
// 	return await db.user.toCollection().first();
// });

// /**
//  * Resolves once the user, org, event_key, etc. stores are loaded from Dexie.
//  * If they have already been loaded, the Promise will instantly resolve.
//  *
//  * 	export const load: PageLoad = async ({ url, fetch }) => {
//  * 		await storesLoaded;
//  * 	}
//  */
// export const storesLoaded = new Promise((resolve, reject) => {
// 	userObservable.subscribe(async (user) => {
// 		try {
// 			if (user) {
// 				userName.set(user.name);
// 				userId.set(user._id);
// 				org_key.set(user.org_key);

// 				// if org exists
// 				const org = await db.orgs.where('org_key').equals(user.org_key).first();
// 				if (org?.event_key) {
// 					event_year.set(Number(org.event_key?.substring(0, 4)));
// 					event_key.set(org.event_key);
// 					// if event exists
// 					const event = await db.events.where('key').equals(org.event_key).first();
// 					if (event?.name) {
// 						event_name.set(event.name);
// 					}
// 				}
// 			}
// 		}
// 		catch (err) {
// 			reject(err);
// 		}
// 		resolve(undefined);
// 	});
// });
