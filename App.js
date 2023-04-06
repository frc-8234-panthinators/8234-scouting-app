import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useState } from 'react';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import {Picker} from '@react-native-picker/picker';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

let teamNumber = 'XXXX';
let connectedToInternet = false;
let forms = [];
let hasLoaded = false;

async function asyncSaveForms() {
  AsyncStorage.setItem('forms', JSON.stringify(forms));
}

export default function App() {
  const [displayNumber, setTeamNumber] = useState(teamNumber);
  const [matchData, setMatchData] = useState(['Loading...']);
  const [wifiColor, setWifiColor] = useState('#C42021');
  const [usbColor, setUSBColor] = useState('#C42021');
  const [selectedForm, setSelectedForm] = useState(0);
  const [formList, setFormList] = useState(forms)
  if (!hasLoaded) {
    hasLoaded = true;
    AsyncStorage.getItem('forms').then((value) => {
      if (value != null) {
        forms = JSON.parse(value);
        setFormList(forms)
      }
    })
  }
  if (teamNumber == 'XXXX') {
    AsyncStorage.getItem('teamNumber').then((value) => {
      if (value != null) {
        teamNumber = JSON.parse(value);
        setTeamNumber(teamNumber);
      }
    });
  }
  setInterval(async () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        connectedToInternet = true;
        setWifiColor('#21C420');
      } else {
        connectedToInternet = false;
        setWifiColor('#C42021');
      }
    });
    const batteryInfo = await Battery.getBatteryStateAsync();
    if (batteryInfo == 1) {
      setUSBColor('#C42021')
    } else if (batteryInfo == 2) {
      setUSBColor('#DFD858')
    }
  }, 5000);
  function teamNumberCallback(value) {
    value = value.nativeEvent.text
    if (value.length == 0) {
      value = 'XXXX';
    }
    teamNumber = value;
    setTeamNumber(value);
    setMatchData(['loading...']);
    AsyncStorage.setItem('teamNumber', JSON.stringify(value));
  }
  function Home({navigation}) {
    function MatchTable() {
      if (displayNumber == 'XXXX' && matchData[0] != 'In order to load match data, please enter your team number in the settings page.') {
        setMatchData(["In order to load match data, please enter your team number in the settings page."])
      }
      let matches = matchData.map((match) => {
        return <Text style={styles.smallText}>{match}</Text>
      });
      return (
        <View style={styles.nestedContainer}>
          {matches}
        </View>
      );
    }
    function RefreshButton({value}) {
      const [pressed, setText] = useState('refresh');
      async function onTestPress() {
        setText('Getting data...')
        const response = await fetch('http://localhost:8000/matchTest', {method: "GET"}).catch((err) => {console.log(err)})
        const responseData = await response.json().catch((err) => {console.log(err)});
        setMatchData(responseData.response);
      }
      return <Pressable className="square" style={styles.testButton} onPress={onTestPress}><Text>{pressed}</Text></Pressable>;
    }
    return (
      <View style={styles.container}>
        <View style={styles.cornerIcon}>
          <Ionicons name='md-wifi' size={36} color={wifiColor}/>
          <Ionicons name='md-code' size={36} color={usbColor}/>
        </View>
        <Text style={styles.basicText}>Team {displayNumber}</Text>
        <View style={styles.upcomingMatchDiv}>
          <Text style={styles.basicText}>Upcoming Matches</Text>
          <MatchTable></MatchTable>
        </View>
        <RefreshButton></RefreshButton>
      </View>
    );
  }
  function ScoutFormCreator() {
    const [questionType, selectQuestionType] = useState('multipleChoice');
    const [toDelete, setToDelete] = useState(0)

    function FormDeleteWarning({navigation}) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="md-warning" style={styles.warningIcon} color="#C1D7F0" size={128}></Ionicons>
          <Text style={styles.smallTextCentered}>Are you sure you want to permanently delete the form "{forms[toDelete].formTitle}"?</Text>
          <View style={styles.sideBySide}>
            <Pressable style={styles.dualButton} onPress={() => {
              let newForms = [];
              Object.assign(newForms, forms)
              newForms.splice(toDelete, 1)
              setFormList(newForms)
              navigation.goBack()
              forms = []
              Object.assign(forms, newForms)
              asyncSaveForms()
              }}><Text style={styles.smallText}>Confirm</Text></Pressable>
            <Pressable style={styles.dualButton} onPress={() => navigation.goBack()}><Text style={styles.smallText}>Cancel</Text></Pressable>
          </View>
        </View>
      )
    }

    function ScoutFormMainPage({navigation}) {
      function editForm(formNum) {
        setSelectedForm(formNum)
        navigation.navigate('ScoutEditPage');
      }
      function deleteForm(formNum) {
        setToDelete(formNum)
        navigation.navigate('FormDeleteWarning');
        asyncSaveForms();
      }
      function SavedFormList() {
        let formTitleList = formList.map((element, index) => {
          return (
            <View style={styles.formListContainer}>
              <Text style={styles.formTitleText}>{element.formTitle}</Text>
              <Pressable style={styles.sideButton} onPress={() => deleteForm(index)}><Ionicons name='md-trash' size={30} color="#C1D7F0"></Ionicons></Pressable>
              <Pressable style={styles.sideButton} onPress={() => editForm(index)}><Ionicons name='md-create' size={30} color="#C1D7F0"></Ionicons></Pressable>
            </View>
          )
        })
        return (
          <View style={styles.wrapper}>
            {formTitleList}
          </View>
        )
      }
      function createNewForm() {
        navigation.navigate('ScoutEditPage');
        forms.push({'formTitle': 'New Form', 'formElements': []})
        setSelectedForm(forms.length - 1);
        asyncSaveForms();
      }
      return (
      <View style={styles.container}>
        <Text style={styles.basicText}>Form Manager</Text>
        <Pressable className="add" style={styles.wideButton} onPress={createNewForm}><Ionicons name='md-add' size={36} color='#C1D7F0'></Ionicons></Pressable>
        <SavedFormList></SavedFormList>
      </View>
      )
    }
    function ScoutFormEditPage({navigation}) {
      const [formData, setFormData] = useState(forms[selectedForm]);
      Object.assign(forms[selectedForm], formData)
      console.log(formData);
      function setQuestionTitle(value, index) {
        let newFormData = {};
        Object.assign(newFormData, formData);
        newFormData.formElements[index].questionText = value.nativeEvent.text;
        setFormData(newFormData);
        asyncSaveForms();
      }
      function FormView() {
        console.log('rendering formview')
        const formInfo = formData.formElements.map((element, index) => {
          if (element.questionType == 'multipleChoice') {
            return (
              <View key={index} style={styles.nestedContainer}>
                <TextInput style={styles.thinInput} placeholder="Question" placeholderTextColor='#2B303B' onEndEditing={(value) => setQuestionTitle(value, index)} defaultValue={formData.formElements[index].questionText}></TextInput>
                <TextInput style={styles.thinInput} placeholder="Option 1" placeholderTextColor='#2B303B' onEndEditing={setFormTitle}></TextInput>
              </View>
            )
          } else if (element.questionType == 'text') {
            return (
              <View style={styles.nestedContainer}>
                <TextInput style={styles.thinInput} placeholder="Question" placeholderTextColor='#2B303B' onEndEditing={setFormTitle}></TextInput>
              </View>
            )
          } else if (element.questionType == 'number') {
            return (
              <View style={styles.nestedContainer}>
                <TextInput style={styles.thinInput} placeholder="Question" placeholderTextColor='#2B303B' onEndEditing={setFormTitle}></TextInput>
              </View>
            )
          }
        })
        return (
          <View style={styles.nestedContainer}>
            {formInfo}
          </View>
        )
      }
      function addNewElement() {
        let newFormData = {};
        Object.assign(newFormData, formData);
        newFormData.formElements.push({'questionType': questionType, 'questionText': 'New Question', 'questionOptions': []});
        setFormData(newFormData);
      }
      function setFormTitle(value) {
        let newFormData = {};
        Object.assign(newFormData, formData);
        newFormData.formTitle = value.nativeEvent.text;
        setFormData(newFormData);
        asyncSaveForms();
      }
      function saveForm() {
        Object.assign(forms[selectedForm], formData);
        setFormList(forms)
        navigation.goBack();
        asyncSaveForms();
      }
      return (
        <ScrollView contentContainerStyle={{backgroundColor: '#23272f', flexGrow: 1}}>
          <View style={styles.container}>
            <Text style={styles.basicText}>Form Editor</Text>
            <TextInput style={styles.thinInput} placeholder="Form Name" placeholderTextColor='#2B303B' onEndEditing={setFormTitle} defaultValue={formData.formTitle}></TextInput>
            <View style={styles.sideBySide}>
              <Picker selectedValue={questionType} style={styles.questionPicker} mode='dropdown' themeVariant="dark" dropdownIconColor={'#C1D7F0'} onValueChange={(value, indx) => selectQuestionType(value)}>
                <Picker.Item label="Multiple Choice" value="multipleChoice" />
                <Picker.Item label="Text" value="text" />
                <Picker.Item label="Number" value="number" />
                <Picker.Item label="Checkbox" value="checkbox" />
              </Picker>
              <Pressable className="addQuestion" style={styles.addButton} onPress={addNewElement}><Ionicons name='md-add' size={36} color='#C1D7F0'></Ionicons></Pressable>
            </View>
            <FormView></FormView>
            <Pressable className="saveForm" style={styles.wideButtonBottom} onPress={saveForm}><Text style={styles.basicText}>Save</Text></Pressable>
          </View>
        </ScrollView>
      )
    }
    return (
      <Stack.Navigator initialRouteName='ScoutMainPage' screenOptions={
        {
          headerShown: false
        }
      }>
        <Stack.Screen name="ScoutMainPage" component={ScoutFormMainPage} />
        <Stack.Screen name="ScoutEditPage" component={ScoutFormEditPage} />
        <Stack.Screen name="FormDeleteWarning" component={FormDeleteWarning} />
      </Stack.Navigator>
    );
  }
  function Settings() {
    function InputLabel({label, inputType, callback, value}) {
      return (
        <View style={styles.sideBySide}>
          <Text style={styles.smallText}>{label}</Text>
          <TextInput placeholder={label} keyboardType={inputType} style={styles.input} placeholderTextColor='#2B303B' onEndEditing={callback} defaultValue={value}></TextInput>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Text style={styles.basicText}>Settings</Text>
        <InputLabel label="Team #" inputType="numeric" callback={teamNumberCallback} value={displayNumber}></InputLabel>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="light" translucent={false} backgroundColor='#23272f' />
      <Tab.Navigator initialRouteName='Home' activeColor="#C42021" screenOptions={( {route} ) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'md-home'
          } else if (route.name === 'Settings') {
            iconName = 'md-settings';
          } else if (route.name === 'Manage Forms') {
            iconName = 'md-add-circle';
          };
          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1D23',
          borderTopWidth: 0,
          paddingBottom: 5,
          height: 60
        },
        tabBarActiveTintColor: '#C42021'
        })}>
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Manage Forms" component={ScoutFormCreator} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23272f',
    alignItems: 'center',
    paddingTop: 10,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#23272f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  questionPicker: {
    flexGrow: 1,
    color: '#C1D7F0',
    backgroundColor: '#1A1D23',
  },
  cornerIcon: {
    position: 'absolute',
    top: '1.5%',
    left: '5%',
    flexDirection: 'row',
    gap: 10,
  },
  sideBySide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    gap: 10,
  },
  nonCenteredContainer: {
    flex: 1,
    backgroundColor: '#23272f',
    paddingTop: 10,
    paddingLeft: 15
  },
  testButton: {
    backgroundColor: 'white',
    width: '99%',
    height: 100,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  basicText: {
    color: '#C1D7F0',
    fontSize: 30,
    marginBottom: 15,
  },
  formTitleText: {
    color: '#C1D7F0',
    fontSize: 30,
    marginBottom: 15,
    marginTop: 15,
    marginLeft: 20,
    flexGrow: 1,
  },
  smallText: {
    color: '#C1D7F0',
    fontSize: 20,
  },
  smallTextCentered: {
    color: '#C1D7F0',
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  upcomingMatchDiv: {
    backgroundColor: '#1A1D23',
    width: '90%',
    height: '49%',
    borderRadius: 20,
    alignItems: 'center',
    paddingTop: 10,
  },
  nestedContainer: {
    backgroundColor: '#1A1D23',
    width: '90%',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#C1D7F0',
    paddingBottom: 15,
  },
  input: {
    backgroundColor: '#1A1D23',
    color: '#C1D7F0',
    flexGrow: 1,
    fontSize: 30,
    padding: 10,
    borderRadius: 10,
  },
  thinInput: {
    backgroundColor: '#1A1D23',
    color: '#C1D7F0',
    fontSize: 20,
    padding: 10,
    marginBottom: 15,
    width: '90%',
  },
  wideButton: {
    width: '90%',
    backgroundColor: '#1A1D23',
    fontSize: 30,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideButtonBottom: {
    width: '90%',
    backgroundColor: '#1A1D23',
    fontSize: 30,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#1A1D23',
    fontSize: 30,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualButton: {
    backgroundColor: '#1A1D23',
    width: '49%',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    marginTop: 20,
    borderRadius: 10,
  },
  sideButton: {
    margin: 10,
  },
  formListContainer: {
    backgroundColor: "#1A1D23",
    width: "90%",
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  wrapper: {
    width: '100%',
    alignItems: 'center'
  },
  warningIcon: {
    position: 'absolute',
    top: '12%',
  }
});