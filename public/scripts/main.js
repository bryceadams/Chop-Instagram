(function($) {
  $('html').on('keyup', function(e) {
    if(e.keyCode === 77) {
      var last_media_id = $('ul.media li').last().data('id');
      var parameters = {
        'last_media_id' : last_media_id
      };
      $.get( '/api/media', parameters, function(data) {
        console.log(data);
      });
    };
  });
})(jQuery);