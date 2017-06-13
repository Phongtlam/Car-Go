import React, { Component } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { connect } from 'react-redux'; // inject data where we need
import MapView from 'react-native-maps';
import axios from 'axios';
import CONFIG from '../../config/development.json';


const mapStateToProps = state => ({
  state,
});

class Maps extends Component {

  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 37.775037,
        longitude: -122.229411,
        latitudeDelta: 0.0322,
        longitudeDelta: 0.6421,
      },
      isMapVisible: false,
      listOfRegions: [],
    };
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition((position) => {
      // const initialPosition = JSON.stringify(position);
    //   console.log('JSON', initialPosition);
    //   console.log('POSITION', position);
      this.setState({
        region: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0522,
          longitudeDelta: 0.0221,
          loc: 0,
        },
        isMapVisible: true,
      });
      axios.get(`${CONFIG.URL}/getMapDetails`, {
        params: {
          location: [position.coords.latitude, position.coords.longitude],
        },
      })
    .then((response) => {
      const coords = [];
      response.data.forEach((item) => {
        coords.push({ latitude: JSON.parse(item.from_coords)[0],
          longitude: JSON.parse(item.from_coords)[1],
        });
      });
      this.setState({ listOfRegions: coords });
      // console.log(this.state.listOfRegions);
    })
    .catch((error) => {
      // console.log(error);
    });
    },
    error => alert(JSON.stringify(error)),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }

  // componentWillMount() {

  //   navigator.geolocation.getCurrentPosition((position) => {
  //     var initialPosition = JSON.stringify(position);
  //     this.setState({
  //       region:  {
  //         latitude: position.coords.latitude,
  //         longitude: position.coords.longitude,
  //         latitudeDelta: 0.0922,
  //         longitudeDelta: 0.3421,
  //         loc: 0,
  //       },
  //       isMapVisible: true,
  //     });
  //   },
  //   (error) => alert(JSON.stringify(error)),
  //     {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
  //   );
  //   axios.get(`${CONFIG.URL}/getMapDetails`)
  //   .then((response) => {
  //     const coords = [];
  //     response.data.forEach(function (item){
  //       coords.push({ latitude: JSON.parse(item.from_coords)[0],
  //         longitude: JSON.parse(item.from_coords)[1],
  //       });
  //     });
  //     this.setState({listOfRegions: coords });
  //     // console.log(this.state.listOfRegions);
  //   })
  //   .catch((error) =>{
  //     console.log(error);
  //   });
  // }


  render() {
    return (
      <MapView
        style={styles.map}
        showsUserLocation
        followUserLocation
        showsCompass
        showsPointsOfInterest
        region={this.state.region}
      >
        {console.log(this.state.listOfRegions)}
        {this.state.listOfRegions.map((marker, id) => (
          <MapView.Marker
            key={id}
            coordinate={marker}
            image={require('../assets/carMarker4.png')}
          />
         ))}
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
});

export default connect(mapStateToProps)(Maps);
