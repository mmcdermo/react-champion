

/* SimplePubSub is a simple js module that lets unrelated components talk to eachother.
*/
var SimplePubSub = (function(){
    var subs = {};
    var uid = 0;
    return {
        /* Subscribe to a channel. The given function `fn` will be called
           whenever a new value is published to the channel.

           Returns a unique key that can be later used for unsubscription.
         */
        subscribe: function(channel, fn){
            if(!(channel in subs)){
                subs[channel] = {};
            }
            var id = uid++;
            subs[channel][id] = fn;
            return id;
        },
        /* Unsubscribe from a channel using the unique key obtained in subscribe
         */
        unsubscribe: function(channel, key){
            if(!(channel in subs)){ return; }
            if(!(key in subs[channel])){ return; }
            delete subs[channel][key];
        },
        publish: function(channel, value){
            if(!(channel in subs)){ return; }
            for(var id in subs[channel]){
                subs[channel][id](value);
            }
        }
    }
})();

var ReactChampion = {};

/* IconButtonGroup is a simple button group with icons.
   Only one button can be active at a time.

   Property overview
     `channel` - changes in value will be broadcast over this SimplePubSub channel
     `value` - default value
     `buttons` - Array of objects of the shape
        {value : String, icon: String, title: String}
     `onChange` - Function to be called when the value changes
*/
ReactChampion.IconButtonGroup = React.createClass({
    propTypes: {
        value: React.PropTypes.any,
        channel: React.PropTypes.string,
        buttons: React.PropTypes.arrayOf(React.PropTypes.shape({
            value: React.PropTypes.any.isRequired,
            icon: React.PropTypes.string,
            title: React.PropTypes.string
        })).isRequired,
        onChange: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {value: this.props.value};
    },
    componentDidMount: function() {
        /* Allow other components to publish to the channel
           and set which button is active
        */
        SimplePubSub.subscribe(this.props.channel, function(newValue){
            this.setState({value: newValue});
        }.bind(this));
    },
    handleClick: function(newValue) {
        this.props.onChange(newValue);
        if(this.props.channel){
            SimplePubSub.publish(this.props.channel, newValue);
        }
        this.setState({value: newValue});
    },
    render: function() {
        var items = this.props.buttons.map(function(item, i){
            var active = item.value === this.state.value ? "active": ""
            return (<li id={"" + i} ref={"item" + i} key={"" + i} className={`${active}`} onClick={this.handleClick.bind(this, item.value)}>
                  <i className={item.icon}></i> <span>{item.title}</span>
                    </li>);
        }.bind(this));

        return (<ul className='iconButtonGroup'>
                {items}
                </ul>);
    },

});

/* MultiButtonGroup is a simple button group enabling multiple choices at once

   Property overview
     `channel` - changes in value will be broadcast over this SimplePubSub channel
     `value` - default value
     `buttons` - Array of objects of the shape
        {value : String, display: Node}
     `onChange` - Function to be called when the value changes
*/
ReactChampion.MultiButtonGroup = React.createClass({
    propTypes: {
        values: React.PropTypes.objectOf(React.PropTypes.bool),
        channel: React.PropTypes.string,
        buttons: React.PropTypes.arrayOf(React.PropTypes.shape({
            value: React.PropTypes.any.isRequired,
            display: React.PropTypes.Node,
        })).isRequired,
        onChange: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        console.log(this.props.values);
        return {values: this.props.values || {}};
    },
    componentDidMount: function() {
        /* Allow other components to publish to the channel
           and set which button is active
        */
        SimplePubSub.subscribe(this.props.channel, function(newValue){
            this.setState({values: newValue});
        }.bind(this));
    },
    handleClick: function(newValue) {
        var value = this.state.values || {};
        if(!(newValue in this.state.values)){
            value[newValue] = true;
        }
        else {
            value[newValue] = !value[newValue];
        }

        this.props.onChange(value);
        if(this.props.channel){
            SimplePubSub.publish(this.props.channel, value);
        }
        this.setState({values: value});
    },
    render: function() {
        var items = this.props.buttons.map(function(item, i){
            var active = this.state.values[item.value] ? "active": ""
            return (<li id={"" + i} ref={"item" + i} key={"" + i} className={`${active}`} onClick={this.handleClick.bind(this, item.value)}>
                    {item.display}
                    </li>);
        }.bind(this));

        return (<ul className='multiButtonGroup buttonGroup'>
                {items}
                </ul>);
    },

});



/* Dropdown is a simple, modern dropdown component

   Property overview
     `channel` - changes in value will be broadcast over this SimplePubSub channel
     `value` - default value
     `options` - Array of options
        {value : String, display: react DOM node}
     `onChange` - Function to be called when the value changes
*/
ReactChampion.Dropdown = React.createClass({
    propTypes: {
        value: React.PropTypes.any,
        channel: React.PropTypes.string,
        options: React.PropTypes.arrayOf(React.PropTypes.shape({
            value: React.PropTypes.any.isRequired,
            display: React.PropTypes.node.isRequired
        })).isRequired,
        onChange: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {value: this.props.value,
               popped: false};
    },
    handleClick: function(newValue) {
        this.toggleDropdown();

        if(this.props.onChange){ this.props.onChange(newValue); }
        if(this.props.channel){
            SimplePubSub.publish(this.props.channel, newValue);
        }
        this.setState({value: newValue});
    },
    toggleDropdown: function(){
        this.setState({popped: !this.state.popped});
    },
    render: function() {
        var selected = "Selected"
        var options = this.props.options.map(function(option, i){
            var node = (<li id={"" + i} ref={"option" + i} key={"" + i} onClick={this.handleClick.bind(this, option.value)}>
                  {option.display}
                        </li>);
            if(option.value === this.state.value){
                selected = option.display;
            }
            return node;
        }.bind(this));

        var popped = this.state.popped === true ? "popped" : "";

        return (
            <div className='reactDropdown' name={this.props.name}>
              <div className={`reactDropdownSelected ${popped}`} onClick={this.toggleDropdown}>
                {selected}
              </div>
              <ul className={`reactDropdownOptions ${popped}`}>
                {options}
              </ul>
            </div>);
    },

});


/* ImageUploader provides an image uploader with progress bar

   Property overview
     `url` - URL to upload image to
     `meta` - Metadata to include with image upload
     `display` - DOM node to display as the image upload button
     `onChange` - Function to be called when the value changes
*/
ReactChampion.ImageUploader = React.createClass({
    propTypes: {
        url: React.PropTypes.string,
        meta: React.PropTypes.any,
        display: React.PropTypes.node,
        onChange: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {progress: 0,
                in_progress: false,
                image: undefined};
    },
    handleClick: function(event) {
        var elem = $(event.target);
        if(elem.hasClass("imageUploader")){ elem.children("input").click(); }
        else {
            elem.parents(".imageUploader").find("input").click();
        }
    },
    updateImageField: function(event){
        var file = event.target.files[0];
        var xhr = new XMLHttpRequest();
        //if (xhr.upload && file.type == "image/jpeg" && file.size <= $id("MAX_FILE_SIZE").value) {

        // Keep progress bar up to date with upload
        var that = this;
        xhr.upload.addEventListener("progress", function(e) {
            var pc = Math.min(parseInt(e.loaded / e.total * 100), 80);
            that.setState({progress: pc});
        }, false);

        this.setState({in_progress: true});
        // file received/failed
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState == 4) {
                that.setState({progress: 100,
                               upload_status: xhr.status === 200 ? "success" : "failure"});
                //Let the progress bar reach 100% before we dismiss it
                setTimeout(function(){
                    that.setState({
                        in_progress: false,
                        progress: 0,
                    });
                }, 1000);
                that.props.onChange(xhr.responseText);
            }
        };

        // start upload
        xhr.open("POST", this.props.url, true);
        xhr.setRequestHeader("X_FILENAME", file.name);

        var formData = new FormData();
        formData.append("thefile", file);
        xhr.send(formData);
    },
    render: function() {
        var progress_bar = <div></div>;
        if(this.state.in_progress){
            var divStyle = {
                width: (this.state.progress + "%")
            };
            progress_bar = <div className="progress_bar">
                <div className='bar' style={divStyle}></div>
            </div>;
        }

        var error = <div></div>
        if(this.state.upload_status === "failure"){
            error = <div className="uploadError">Image upload failed.</div>
         }
        return (
            <div className='imageUploader'>
                <input type='file' onChange={this.updateImageField}/>
                {progress_bar}
                {error}
                <div onClick={this.handleClick}>
                    {this.props.display}
                </div>
            </div>);
    }

});

/* AnimatedTabs provides transitions between content tabs using
   ReactCSSTransitionGroup

   Property overview
     `active_tab` - Currently active tab
     `tabs` - Object of options
        keys: tab_name
        values: react DOM node
     `transitionName` - ReactCSSTransitionGroup transition name
*/
ReactChampion.AnimatedTabs = React.createClass({
    propTypes: {
        active_tab: React.PropTypes.string,
        channel: React.PropTypes.string,
        transitionName: React.PropTypes.string,
        options: React.PropTypes.objectOf(React.PropTypes.any).isRequired,
        onChange: React.PropTypes.func,
    },
    getInitialState: function() {
        return {active_tab: this.props.active_tab};
    },
    componentDidMount: function() {
        SimplePubSub.subscribe(this.props.channel, function(newValue){
            this.setState({active_tab: newValue});
        }.bind(this));
    },
    render: function(){
        //Allow users to supply custom keys to force reload
        var key = this.state.active_tab;
        var node = this.props.options[this.state.active_tab];
        var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
        if("custkey" in node){
            key = node["custkey"];
            node= node["node"];
        }
        var tabs = [<div className={"wataburger_"+this.state.active_tab} key={key}>
                    {node}
                    </div>
                   ];
        return (<div className='animate_tabs'>
                  <ReactCSSTransitionGroup transitionName={this.props.transitionName}>
                  {tabs}
                  </ReactCSSTransitionGroup>
                </div>
               );
    }
});

/* TabbedContent separates content into clickable tabs

   Property overview
     `default_tab` - Default tab
     `tabs` - Object of options
        keys: tab_name
        values: react DOM node
     `transitionName` - ReactCSSTransitionGroup transition name
*/
ReactChampion.TabbedContent = React.createClass({
    propTypes: {
        default_tab: React.PropTypes.string,
    },
    getInitialState: function() {
        return {active_tab: this.props.default_tab,
               content: this.props.tabs[this.props.default_tab]};
    },
    componentDidMount: function() {
        SimplePubSub.subscribe(this.props.channel, function(newValue){
            this.setState({active_tab: newValue});
        }.bind(this));
    },
    tabClick: function(idx){
        this.setState({
            active_tab: idx,
            content: this.props.tabs[idx]});
    },
    render: function(){
        var content = this.props.tabs[this.state.active_tab]
        var tabs = [];
        for(var idx in this.props.tabs){
            tabs.push(<li onClick={this.tabClick.bind(this, idx)} className={idx === this.state.active_tab ? "active":""}>{idx}</li>);
        }

        return <div className='reactChampionTabArea'>
            <ul className='reactChampionTabs'>{tabs}</ul>
            {content}
        </div>
    }
});


/* SubmitButton provides a button that displays loading/processing state,
   and only allows itself to be clicked once until its state is reset

   Property overview
     `content` - react DOM node
     `loading` - react DOM node
     `onClick` - method called on click when not loading or disabled

     `disabled`- optional DOM node
     `is_disabled` - optional Bool
     `is_loading` - optional Bool
*/
ReactChampion.SubmitButton = React.createClass({
    propTypes: {
        content: React.PropTypes.node.isRequired,
        loading: React.PropTypes.node.isRequired,
        completed: React.PropTypes.node,
        disabled: React.PropTypes.node,
        onClick: React.PropTypes.func.isRequired,
        is_disabled: React.PropTypes.bool,
        is_loading: React.PropTypes.bool,
        is_completed: React.PropTypes.bool,
    },
    getInitialState: function() {
        return {}
    },
    handleClick: function(args){
        if(!this.state.is_loading && !this.state.is_disabled){
            if(this.props.onClick){ this.props.onClick(args); }
        }
    },
    componentDidMount: function() {
    },
    render: function(){
        var button_content = this.props.content;
        if(this.props.is_loading){ button_content = this.props.loading }
        if(this.props.is_disabled){ button_content = this.props.disabled ? this.props.disabled : this.props.content; }
        if(this.props.is_completed){ button_content = this.props.completed ? this.props.completed : this.props.content }

        var classes = "submit_button " + this.props.className
            + " " + (this.props.is_loading ? "loading": "");
            + " " + (this.props.is_disabled ? "disabled": "");
            + " " + (this.props.is_completed ? "completed": "");

        return (
            <div>
                <div className={classes} onClick={this.handleClick}>{button_content}</div>
                <DisplayMaybe className="submit_error" display={this.props.error} />
            </div>
               );
    }
});

/* ValidateInput provides an input field with optional means of validating
   its contents

   Property overview
     `onChange` - function to call on change
     `placeholder` - placeholder value
     `defaultValue` - default value
     `name` - (optional String) name of the field
     `textarea` - (optional Bool) should this be a textarea?
     `max_length` - (optional Int) maximum content length
*/
ReactChampion.ValidatedInput = React.createClass({
    propTypes: {
        placeholder: React.PropTypes.string,
        defaultValue: React.PropTypes.string,
        error: React.PropTypes.string,
        name: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired,
        textarea: React.PropTypes.bool,
        max_length: React.PropTypes.number,
    },
    getInitialState: function() {
        return {
            value: this.props.defaultValue
        };
    },
    //Adjust textarea height automatically
    adjustHeight: function(){
        if(this.props.textarea && this.props.elastic){
            node = $(React.findDOMNode(this)).find("textarea")[0];
            node.style.height = "1px";
            node.style.height = (25+node.scrollHeight)+"px";
        }
    },
    handleChange: function(event){
        var val = event.target.value;
        if(this.props.max_length){
            val = val.substr(0, this.props.max_length);
        }
        event.target.value = val;
        this.setState({value:val});
        this.props.onChange(val, event);

        this.adjustHeight();
    },
    componentDidMount: function() {
        setTimeout(function(){
            this.adjustHeight();
        }.bind(this),100);
    },
    render: function(){
        var remaining = <div></div>;
        if(this.props.max_length){ remaining = <div className='chars_remaining' >{this.state.value.length}/{this.props.max_length}</div>; }

        if(this.props.textarea){
            return <div>
                <textarea onChange={this.handleChange} placeholder={this.props.placeholder} defaultValue={this.state.value} name={this.props.name} />
                {remaining}
            </div>;
        }
        else {
            return <div>
                <input type='text' onChange={this.handleChange} name={this.props.name} defaultValue={this.state.value} placeholder={this.props.placeholder} />
                {remaining}
            </div>;
        }

    }
});


/* DisplayMaybe only displays its contents and children if they're nonempty

   Property overview
     `display` - (optional) Content to display
     `condition` - (optional) Manually decide whether to show or hide `display`
*/
ReactChampion.DisplayMaybe = React.createClass({
    propTypes: {
        display: React.PropTypes.node,
        className: React.PropTypes.string
    },
    render: function(){
        var classes = this.props.className + " display_maybe_visible";

        var condition = this.props.condition === undefined ?
            true : this.props.condition;

        if((this.props.display || React.Children.count(this.props.children))
           && condition){
            return <div className={classes}>
                {this.props.children}
                {this.props.display}
            </div>;
        }
        else { return <div className="display_maybe_hidden"></div> }
    }
});


/* Modal provides a simple popup

   Property overview
     `content` - Content to display
     `channel` - Name of channel to listen on for "open" or "close" signals
     `display` - (optional) Condition to display modal
*/
ReactChampion.Modal = React.createClass({
    propTypes: {
        content: React.PropTypes.node,
    },
    getInitialState: function() {
        return {
            display: this.props.display,
        };
        return {}
    },
    componentDidMount: function(){
        SimplePubSub.subscribe(this.props.channel,
                               function(state){
                                   this.setState({display: state});
                               }.bind(this));
    },
    close: function(){
        SimplePubSub.publish(this.props.channel, "fadeout");
    },
    render: function(){
        var c = "reactChampionModal "+this.state.display;
        if(this.state.display === "fadein"){
            setTimeout(function(){
                this.setState({display: "open"});
            }.bind(this), 100);
        }

        if(this.state.display === "fadeout"){
            setTimeout(function(){
                this.setState({display: "close"});
            }.bind(this), 500);
        }

        return (<div className={c}>
              <div className="reactChampionModalContent">
                <div className="reactChampionModalClose" onClick={this.close}>X</div>
               {this.props.content}
              </div>
            </div>)

    }
});
