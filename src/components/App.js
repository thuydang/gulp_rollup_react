import React, { Component } from "react";
//import PropTypes from 'react-proptypes';
import cn from 'classnames';
import bs from 'bootstrap/dist/css/bootstrap.css';
import idxsty from '../styles/index.css';
import appsty from './App.css';
import Modal from "./Modal";
import axios from "axios";

// Passing cssModules to reacstrap Modal
// https://stackoverflow.com/a/62565909/707704
let styles = Object.assign({}, bs)


//const cx = cn.bind(styles);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      viewCompleted: false,
      activeItem: {
        title: "",
        description: "",
        completed: false
      },
      todoList: []
    };
  }
  refreshList = () => {
    axios
      .get("http://192.168.39.162:3000/api/servicelisting/")
      .then(res => this.setState({ todoList: res.data }))
      .catch(err => console.log(err));
  };
  toggle = () => {
    this.setState({ modal: !this.state.modal });
  };
  handleSubmit = item => {
    this.toggle();
    if (item.id) {
      axios
        .put(`http://192.168.39.162:3000/api/servicelisting/${item.id}/`, item)
        .then(res => this.refreshList());
      return;
    }
    axios
      .post("http://192.168.39.162:3000/api/servicelisting/", item)
      .then(res => this.refreshList());
  };
  handleDelete = item => {
    axios
      .delete(`http://192.168.39.162:3000/api/servicelisting/${item.id}`)
      .then(res => this.refreshList());
  };
  createItem = () => {
    const item = { title: "", description: "", completed: false };
    this.setState({ activeItem: item, modal: !this.state.modal });
  };
  editItem = item => {
    this.setState({ activeItem: item, modal: !this.state.modal });
  };
  // 
  componentDidMount() {
    this.refreshList();
  }
  displayCompleted = status => {
    if (status) {
      return this.setState({ viewCompleted: true });
    }
    return this.setState({ viewCompleted: false });
  };
  renderTabList = () => {
    return (
      <div styleName="my-5 tab-list">
        <span
          onClick={() => this.displayCompleted(true)}
          styleName={this.state.viewCompleted ? 'bs.active' : ""}
        >
          complete
        </span>
        <span
          onClick={() => this.displayCompleted(false)}
          styleName={this.state.viewCompleted ? "" : 'bs.active'}
        >
          Incomplete
        </span>
      </div>
    );
  };
  renderItems = () => {
    const { viewCompleted } = this.state;
    const newItems = this.state.todoList.filter(
      item => item.completed == viewCompleted
    );
    return newItems.map(item => (
      <li
        key={item.id}
        styleName="list-group-item d-flex justify-content-between align-items-center"
      >
        <span
          styleName={`todo-title mr-2  ${this.state.viewCompleted ? "completed-todo" : ""}`}  
          title={item.description}
        >
          {item.title}
        </span>
        <span>
          <button 
            styleName="btn btn-secondary mr-2"
            onClick={() => this.editItem(item)}
          > 
            Edit 
          </button>
          <button 
            onClick={() => this.handleDelete(item)}
            styleName="btn btn-danger"
          >
            Delete <
        /button>
        </span>
      </li>
    ));
  };
  render() {
    return (
      <main styleName="content">
        <h1 className={cn(bs['text-white'])} styleName="App-header bs.text-white text-uppercase text-center my-4">Todo app</h1>
        <div styleName="row ">
          <div styleName="col-md-6 col-sm-10 mx-auto p-0">
            <div styleName="card p-3">
              <div styleName="">
                <button 
                  onClick={this.createItem}
                  styleName="btn btn-primary"
                >
                  Add task
                </button>
              </div>
              {this.renderTabList()}
              <ul styleName="list-group list-group-flush">
                {this.renderItems()}
              </ul>
            </div>
          </div>
        </div>
        {this.state.modal ? (
          <Modal
            globalCssModule={styles}
            //className={cn(styles.modal, styles.fade, styles.show, styles['modal-header'])}
            activeItem={this.state.activeItem}
            toggle={this.toggle}
            onSave={this.handleSubmit}
          />
        ) : null}
      </main>
    );
  }
}
export default App;

