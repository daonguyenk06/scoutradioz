import type { PageLoad } from './$types';
import type { LayoutField } from '$lib/types';
import { error, redirect } from '@sveltejs/kit';
import { event_key, event_year, getStore, org_key, } from '$lib/stores';
import db from '$lib/localDB';

export const load: PageLoad = async ({ url, fetch }) => {
	// check if logged in
	if (!getStore(event_key) || !getStore(org_key)) {
		throw redirect(307, '/');
	}

	const team_key = url.searchParams.get('key');
	const teamNumber = Number(team_key?.replace('frc', ''));

	if (!team_key || !teamNumber) throw error(404, new Error('Team key is either not defined or invalid'));

	const layout = db.layout
		.where({
			org_key: getStore(org_key),
			year: getStore(event_year),
			form_type: 'pitscouting'
		})
		.toArray();
	
	const pitScoutingEntry = await db.pitscouting
		.where({
			org_key: getStore(org_key),
			event_key: getStore(event_key),
			team_key,
		})
		.first();
	
	if (!pitScoutingEntry) throw error(404, new Error(`Pit scouting assignment not found for key ${team_key} at event ${getStore(event_key)}`));

	return { layout, key: team_key, teamNumber, pitScoutingEntry };
};
