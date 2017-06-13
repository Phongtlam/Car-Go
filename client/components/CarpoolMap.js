import React, { Component, PropTypes } from 'react';
import {
View,
Text,
AsyncStorage,
StyleSheet,
} from 'react-native';
import pick from 'lodash/pick';
import MapView from 'react-native-maps';
import DrawerButton from './DrawerButton';
import MapButton from './MapButton';
import Polyline from '@mapbox/polyline';
import axios from 'axios';
import CONFIG from '../../config/development.json';
import PubNub from 'pubnub';
//import { addPubNubPublisher, unSubscribe, pubnubStop, getPolyLineDetails } from '../services/pubnubClient';


const pubnub = new PubNub({
  subscribe_key: CONFIG.pubnub.subscribeKey,
  publish_key: CONFIG.pubnub.publishKey,

});

class clientPubNub extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: 'CarPool Map',
    headerLeft: <DrawerButton navigation={navigation} />,
    headerRight: <MapButton navigation={navigation} />,
    drawerLabel: 'CarPool Map',
  });

  constructor(props) {
    super(props);
    this.state = {
      channelName: '',
      channelUserRole: '',
      isRouteTracking: false,
      routeCoordinates: [],
      coords: [],
      riderCoords : {
        latitude: 0,
        longitude: 0,
      },
      Destination : '',
      Source: '',
      finalDestination: {},
    };
    navigator.geolocation.clearWatch(this.watchId);
  }

  componentDidMount() {
    AsyncStorage.getItem('MapGroup', (err, group_data) => {
      this.state.channelName = JSON.parse(group_data).group;
      this.state.channelUserRole = JSON.parse(group_data).role;
      //this.state.Destination = JSON.parse(group_data).goingTo;
      this.state.Destination = 'Hayward';
      axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${this.state.Destination}&key=${CONFIG.GoogleGeocoder.key}`)
      .then((data) => {
        this.state.finalDestination = data.data.results[0].geometry.location;
      })
      .catch((error) => {
        console.log('error from google', error);
      });
      if (this.state.channelUserRole === 'Driver') {
        this.watchUserPostion();
      } else if(this.state.channelUserRole === 'Rider') {
        this.addPubNubListener(this.state.channelName);
      }
    });

    //For Carpool live tracking on mount and unmount
    this.setState({
      isRouteTracking: true,
    });
  }
  //Stop tracking on Map when component unMounts
  componentWillUnmount() {
    this.state.isRouteTracking = false;
  }
 
 //For Publishing 
  watchUserPostion() {
    alert("From publisher");
    this.getPolyLineDetails();
    this.watchID = navigator.geolocation.watchPosition((position) => {
      let { routeCoordinates } = this.state;
      let newLatLngs = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const positionLatLngs = pick(position.coords, ['latitude', 'longitude']);
  
      //For Carpool live tracking on mount and unmount
      if (this.state.isRouteTracking) {
          this.setState({ routeCoordinates: routeCoordinates.concat(positionLatLngs) });
      }

      //For conditional publishing with switched groups
      AsyncStorage.getItem('MapGroup', (err, group_data) => {
        if (this.state.channelName === JSON.parse(group_data).group) {
          //check if the destination has reached
          if((this.state.finalDestination.lat === positionLatLngs.latitude) && (this.state.finalDestination.lng === positionLatLngs.longitude)) {
            UnsubscribeRiders();
          }
          this.addPubNubPublisher( positionLatLngs, this.state.channelName, this.state.channelUserRole )
        }
      });
    },

    //Watch for every 1 sec of location change
    (error) => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }


//For Subscribing
  addPubNubListener = (channelName) => {
    alert("From listener");
    const that = this;
    let counter =0;
    pubnub.addListener({
      status(statusEvent) {
        if (statusEvent.category === 'PNConnectedCategory') {
          console.log('need to checkk=============================');
        } else if (statusEvent.category === 'PNUnknownCategory') {
          pubnub.setState({
            state: { new: 'error' },
          },(status) => {
              console.log(statusEvent.errorData.message);
            });
          }
      },
    message(message) {

      //For Carpool live tracking on mount and unmount
      if (that.state.isRouteTracking) {
        let { routeCoordinates } = that.state;

        //Get the driver position to estimate the arrival timings initially 
        if(counter === 0) {
          that.getTimings(message.message.position);
          counter++;       
        }
        if (message.message.player === 'Driver') {
          //Plot the received driver's positions on the map
          that.setState({ routeCoordinates: routeCoordinates.concat(message.message.position) });
        }
      }    
    }
  });
  pubnub.subscribe({
    channels: [channelName],
  });

  };

  addPubNubPublisher = (positionLatLngs, channelName, userRole) => {
    console.log('positions for publishing', positionLatLngs);
    pubnub.publish({
      message: {
        player: userRole,
        position: positionLatLngs,
      },
      channel: channelName,
    },
    (status, response) => {
      if (status.error) {
        console.log(status.errorData);
      } else {
        console.log('message Published w/ timetoken', response.timetoken, channelName);
      }
    });
  };

  //Get the arrival timings of driver at Riders position 
  getTimings = (currentDriverPosition) => {
    const key = CONFIG.GoogleGeocoder.key;
    const DriverPosition = currentDriverPosition.latitude + "," + currentDriverPosition.longitude;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        var currentRiderPosition = ''+ position.coords.latitude + "," + position.coords.longitude;
        this.setState({
          riderCoords : {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        });
        axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${currentRiderPosition}&destination=${DriverPosition}&key=${key}`)
        .then((data) => {
          alert(`Driver will reach in ${data.data.routes[0].legs[0].duration.text}` );
        })
        .catch((error) => {
          console.log('error from google', error);
        });
      },
      (error) => alert(error.message),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 100}
    );
  }


  //Google polyline for Drivers
  getPolyLineDetails = () => {
    const startLocation = '37.783692, -122.408967';
    const endLocation = 'Fremont';
    const wayPoints = ['Foster City, CA', 'Redwood City. CA'];
    const key = CONFIG.GoogleGeocoder.key;
    axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLocation}&destination=${endLocation}&waypoints=optimize:true|${wayPoints}&key=${key}`)
    .then((data) => {
      const points = Polyline.decode(data.data.routes[0].overview_polyline.points);
      const coords = points.map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));
      this.setState({coords: coords})
    })
    .catch((error) => {
      console.log('error from google', error);
    });
  };

  // Need to Implement Get all Riders pick up points
  getRidersPickUpPoints = () => {

  }

  //Unsubscribe 
  UnsubscribeRiders = () => {
    //check if the user reached the destination, and stop subscription by default
    navigator.geolocation.clearWatch(this.watchID);
    pubnub.unsubscribeAll();
  }

  render() {
    return (
      <MapView
        style={styles.map}
        showsUserLocation
        // followUserLocation
        showsCompass
        showsPointsOfInterest
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0522,
          longitudeDelta: 0.0421
        }}    
        // overlays={[{
        //   coordinates: this.state.routeCoordinates,
        //   strokeColor: 'purple',
        //   strokeWidth: 5
        // }]}
        >    
        <MapView.Polyline 
          coordinates={this.state.routeCoordinates}
          strokeWidth={3}
          strokeColor="blue"/>

        <MapView.Marker
          coordinate={this.state.riderCoords}
          title={"My Location"}
          pinColor = "red"
        />
      </MapView> 
         
    );
  }
}
const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
  containers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  map: {
    flex: 1,
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default clientPubNub;

