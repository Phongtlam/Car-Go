import { SET_PROFILE, SET_HOME_PROFILE } from '../actions/type';

//  Setting initial state is necessary for redux to import state to other files

const INITIAL_STATE = {
  first_name: '',
  last_name: '',
  age: '',
  gender: '',
  phone_number: '',
  preferred_ride: '',
  language: '',
  pets: '',
  smoking: '',
  about_me: '',
  music_preference: '',
  existing_user: true,
  user_id: '',
};

//  This reducer is returning the initial state as default
//  The state is deconstructed and the new value called by the action creator is added to the state

const preferences = (state = INITIAL_STATE, { type, data }) => {
  let newState = { ...state };
  if (data) {
    if (data.home) {
      newState = Object.assign(newState, data);
    } else {
      const property = Object.keys(data);
      newState[property] = data[property];
      return newState;
    }
  }

  switch (type) {
    case SET_PROFILE:
      return newState;
    case SET_HOME_PROFILE:
      return newState;
    default:
      return state;
  }
};

export default preferences;
