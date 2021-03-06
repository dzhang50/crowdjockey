/*globals R, Main, Modernizr, rdioUtils */


function updatePlaylist() {
	//console.log(JSON.stringify(Main.playlist, null, 2));
	
	if(Main.playlist.length > 6) {
		Main.playlist.shift();
	}
	
	$(".albumPlaylist").remove();
	
	Main.$playlist.innerHTML = "";
	
    _.each(Main.playlist, function(album) {
		var $el = $(Main.playlistTemplate(album))
          .appendTo(Main.$playlist);
        
        var $cover = $el.find(".smallIcon");
          $cover.hover(function() {
            $el.addClass("hover");
          }, function() {
            $el.removeClass("hover");
          });
        
		
        $el.find(".play")
          .click(function() {
            R.player.play({source: album.key});
          });
		
        $el.find(".delete")
          .click(function() {
			var idx = Main.playlist.indexOf(album);
            Main.playlist.splice(idx, 1);
			updatePlaylist();
          });
	});
};

(function() {

	
  window.Main = {
    // ----------
    init: function() {
      var self = this;
      
      this.$input = $(".search input");
      this.$results = $(".results");
      this.$playlist = $(".playlist");

      this.rawTemplate = $.trim($("#album-template").text());
      this.rawPlaylistTemplate = $.trim($("#playlist-template").text());
      this.albumTemplate = _.template(this.rawTemplate);
      this.playlistTemplate = _.template(this.rawPlaylistTemplate);
	  
	  this.playlist = [];
	  
	  R.ready(function() {
        if (R.authenticated()) {
            $('.unauthenticated').hide();
        } else {
          $('.unauthenticated').show();
          $('.authenticated').hide();
          $('.auth').click(function() {
			alert("Authenticating");
            R.authenticate(function() {
              if (R.authenticated()) {
                $('.unauthenticated').hide();
				$('.authenticated').show();
                //self.start();
              }
            });
          });
        }
      });

      if (Modernizr.touch) {
        self.$results
          .click(function() {
            $(".album").removeClass("hover");          
          });
      } else {
        _.defer(function() {
          self.$input.focus();
        });
      }
              
      $(".search")
        .submit(function(event) {
          event.preventDefault();
          var query = self.$input.val();
          if (query) {
            R.ready(function() { // just in case the API isn't ready yet
              self.search(query);
            });
          }
        });
		
      $(".search")
        .on("input", function(event) {
          event.preventDefault();
          var query = self.$input.val();
          if (query) {
            R.ready(function() { // just in case the API isn't ready yet
              self.autocomplete(query);
            });
          }
        });

      if (!rdioUtils.startupChecks()) {
        return;
      }

      R.ready(function() {
        var $play = $(".header .play")
          .click(function() {
            R.player.togglePause();
          });
        
        $(".header .next")
          .click(function() {
            R.player.next();
          });
        
        $(".header .prev")
          .click(function() {
            R.player.previous();
          });
        
        R.player.on("change:playingTrack", function(track) {
          $(".header .icon").attr("src", track.get("icon"));
          $(".header .track").text("Track: " + track.get("name"));
          $(".header .album-title").text("Album: " + track.get("album"));
          $(".header .artist").text("Artist: " + track.get("artist"));
        });
        
        R.player.on("change:playState", function(state) {
          if (state === R.player.PLAYSTATE_PLAYING || state === R.player.PLAYSTATE_BUFFERING) {
            $play.text("pause");
          } else {
            $play.text("play");
          }
        });
        
        R.request({
          method: "getTopCharts", 
          content: {
            type: "Track"
          },
          success: function(response) {
            self.showResults(response.result);
          },
          error: function(response) {
            $(".error").text(response.message);
          }
        });
      });
    }, 
    
    // ----------
    search: function(query) {
      var self = this;
      R.request({
        method: "search", 
        content: {
          query: query, 
          types: "Track"
        },
        success: function(response) {
          self.$input.val("");
          self.showResults(response.result.results);
        },
        error: function(response) {
          $(".error").text(response.message);
        }
      });
    },
    // ----------
    autocomplete: function(query) {
      var self = this;
      R.request({
        method: "search", 
        content: {
          query: query, 
          types: "Track"
        },
        success: function(response) {
		  self.$input.focus();
          self.showResults(response.result.results);
        },
        error: function(response) {
          $(".error").text(response.message);
        }
      });
    },
    
    // ----------
    showResults: function(albums) {
      var self = this;
      this.$results.empty();
      
      _.each(albums, function(album) {
        album.appUrl = album.shortUrl.replace("http", "rdio");        
        var $el = $(self.albumTemplate(album))
          .appendTo(self.$results);
        
        var $cover = $el.find(".icon");
        if (Modernizr.touch) {  
          $cover.click(function(event) {
            event.stopPropagation();
            if (!$el.hasClass("hover")) {
              $(".album").not($el).removeClass("hover");
              $el.addClass("hover");
            }
          });
        } else {
          $cover.hover(function() {
            $el.addClass("hover");
          }, function() {
            $el.removeClass("hover");
          });
        }
        
        $el.find(".play")
          .click(function() {
            R.player.play({source: album.key});
          });
		  
        $el.find(".add")
          .click(function() {
			//addToPlaylist(album);
            //R.player.play({source: album.key});
			Main.playlist.push(album);
			updatePlaylist();
          });
      });
    }
  };
  
  // ----------
  $(document).ready(function() {
    Main.init();
  });
  
})();  
