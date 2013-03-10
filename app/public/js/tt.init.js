var TT = TT || {};
TT.Init = (function () {

  var pub = {};

  pub.firstRun = true;

  // bootstrap functions

  pub.preloadColumns = function () {
    // Readymade columns
    // TODO: Allow creating & saving custom columns and layouts

    TT.Model.Column.add({
      name: 'Labels',
      active: false,
      sortable: false,
      template: function () {
        var labels = TT.Utils.sortByProperty(TT.Model.Label.find({ active: true }), 'name');
        return TT.View.render('epics', { labels: labels });
      },
      afterTemplateRender: function () {
        $('.epic').each(function () {
          var w = $(this).data('stories') + $(this).data('points');
          $(this).width(w * 2);
        });
      }
    });

    TT.Model.Column.add({
      name: 'Icebox',
      active: false,
      sortable: false,
      template: function () {
        return TT.View.render('emptyIcebox');
      },
      filter: function (story) {
        return story.current_state === 'unscheduled';
      },
      onDragIn: function (story) {
        return { current_state: 'unscheduled' };
      },
      onDragOut: function (story) {
        return { current_state: 'unstarted' };
      }
    });

    TT.Model.Column.add({
      name: 'Unstarted',
      active: true,
      filter: function (story) {
        return story.current_state === 'unstarted';
      },
      onDragIn: function (story) {
        return { current_state: 'unstarted' };
      }
    });

    TT.Model.Column.add({
      name: 'Started',
      active: true,
      filter: function (story) {
        return story.current_state === 'started';
      },
      onDragIn: function (story) {
        return {
          current_state: 'started',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'Finished',
      active: true,
      filter: function (story) {
        return story.current_state === 'finished';
      },
      onDragIn: function (story) {
        return {
          current_state: 'finished',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'In QA',
      active: false,
      filter: function (story) {
        return story.current_state === 'finished' && !TT.Model.Story.hasTag(story, 'passedqa');
      },
      onDragIn: function (story) {
        return {
          current_state: 'finished',
          labels: TT.Model.Story.addTag(story, 'inqa').labels,
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      },
      onDragOut: function (story) {
        return { labels: TT.Model.Story.removeTag(story, 'inqa').labels };
      }
    });

    TT.Model.Column.add({
      name: 'Passed QA',
      active: false,
      filter: function (story) {
        return story.current_state === 'finished' && TT.Model.Story.hasTag(story, 'passedqa');
      },
      onDragIn: function (story) {
        return {
          current_state: 'finished',
          labels: TT.Model.Story.addTag(story, 'passedqa').labels,
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      },
      onDragOut: function (story) {
        return { labels: TT.Model.Story.removeTag(story, 'passedqa').labels };
      }
    });

    TT.Model.Column.add({
      name: 'Rejected',
      active: false,
      filter: function (story) {
        return story.current_state === 'rejected';
      },
      onDragIn: function (story) {
        return {
          current_state: 'rejected',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'Delivered',
      active: true,
      filter: function (story) {
        return story.current_state === 'delivered';
      },
      onDragIn: function (story) {
        return {
          current_state: 'delivered',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'Accepted',
      active: true,
      filter: function (story) {
        return story.current_state === 'accepted';
      },
      onDragIn: function (story) {
        return {
          current_state: 'accepted',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    /*
    TT.Model.Column.add({
      name: 'Current',
      active: false,
      filter: function (story) {
        return story.current_iteration === 0;
      }
    });

    TT.Model.Column.add({
      name: 'Backlog',
      active: false,
      filter: function (story) {
        return story.current_iteration !== 0;
      }
    });
    */

  };

  pub.preloadFilters = function () {
    if (TT.Model.Filter.isEmpty({ name: 'Owned by Me' })) {
      TT.Model.Filter.add({
        name: 'Owned by Me',
        type: 'user',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return story.owned_by === $.cookie('pivotalUsername') ||
            TT.Model.Story.hasTag(story, '[pair=' + $.cookie('pivotalUsername').toLowerCase() + ']');
        }
      });
    } else {
      TT.Model.Filter.update({ name: 'Owned by Me' }, {
        fn: function (story) {
          return story.owned_by === $.cookie('pivotalUsername') ||
            TT.Model.Story.hasTag(story, '[pair=' + $.cookie('pivotalUsername').toLowerCase() + ']');
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'Requested by Me' })) {
      TT.Model.Filter.add({
        name: 'Requested by Me',
        type: 'user',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return story.requested_by === $.cookie('pivotalUsername');
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'QAed by Me' })) {
      TT.Model.Filter.add({
        name: 'QAed by Me',
        type: 'user',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return TT.Model.Story.hasTag(story, '[qa=' + $.cookie('pivotalUsername').toLowerCase() + ']');
        }
      });
    } else {
      TT.Model.Filter.update({ name: 'QAed by Me' }, {
        fn: function (story) {
          return TT.Model.Story.hasTag(story, '[qa=' + $.cookie('pivotalUsername').toLowerCase() + ']');
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'Current Iteration' })) {
      TT.Model.Filter.add({
        name: 'Current Iteration',
        type: 'iteration',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return story.current_iteration === 0;
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'Next Iteration' })) {
      TT.Model.Filter.add({
        name: 'Next Iteration',
        type: 'iteration',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return story.current_iteration === 1;
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'Updated Recently' })) {
      TT.Model.Filter.add({
        name: 'Updated Recently',
        type: 'time',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          var three_days = 1000 * 60 * 60 * 24 * 3;
          var updated = new Date(story.updated_at).getTime();
          return updated > (new Date().getTime() - three_days);
        }
      });
    }
  };

  pub.restoreFilters = function () {
    var filters = TT.Model.Filter.clientLoad();

    $.each(filters, function (index, filter) {
      if (filter.pure) {
        filter.fn = eval(filter.fn);
        TT.Model.Filter.add(filter);
      } else {
        if (filter.type === 'user') {
          filter.fn = function (story) {
            return story.owned_by === filter.name || story.requested_by === filter.name ||
              TT.Model.Story.hasTag(story, '[pair=' + name.toLowerCase() + ']') ||
              TT.Model.Story.hasTag(story, '[qa=' + name.toLowerCase() + ']');
          };
          TT.Model.Filter.add(filter);
        } else if (filter.type === 'tag') {
          filter.fn = function (story) {
            return TT.Model.Story.hasTag(story, filter.name);
          };
          TT.Model.Filter.add(filter);
        } else if (filter.type === 'search') {
          filter.active = false;
          var terms = TT.Search.parseSearchQuery(filter.name);
          filter.fn = function (story) {
            if (terms.length === 0) {
              return true;
            }
            var text = JSON.stringify(story).toLowerCase();
            var match = true;
            $.each(terms, function (i, term) {
              if (text.indexOf(term) === -1) {
                match = false;
              }
            });

            return match;
          };
          TT.Model.Filter.add(filter);
          $('.filter[data-filter-id="' + filter.id + '"]').click(function () {
            TT.Search.requestMatchingStories(filter.name);
            $(this).unbind('click');
          });
        }
      }
    });
  };

  pub.setLayout = function () {
    var defaultLayout = [];
    TT.Model.Column.each(function (index, column) {
      defaultLayout[defaultLayout.length] = {
        name: column.name,
        active: column.active
      };
    });
    var savedLayout = TT.Model.Layout.clientLoad();

    // reset when columns are updated
    if (savedLayout && savedLayout.length !== defaultLayout.length) {
      savedLayout = defaultLayout;
    }

    TT.Model.Layout.replace(savedLayout ? savedLayout : defaultLayout);

    TT.Model.Layout.each(function (index, column) {
      TT.Model.Column.update({ name: column.name }, { active: column.active });
    });
  };

  pub.setInactiveProjects = function () {
    var projectList = TT.Utils.localStorage('projectList');

    if (projectList) {
      $('#projects .project').addClass('inactive');
      $.each(JSON.parse(projectList), function (index, id) {
        $('#project-' + id).removeClass('inactive');
      });
    }
  };

  pub.requestProjectsAndIterations = function (forceRefresh) {
    function useProjectData(projects) {
      TT.Ajax.end();
      pub.addProjects(projects);
      TT.View.drawProjectList(projects);
      pub.setInactiveProjects();
      pub.requestAllIterations();
    }

    TT.Ajax.start();
    var projects = TT.Utils.localStorage('projects');

    if (projects && forceRefresh !== true) {
      useProjectData(JSON.parse(projects).project);
    } else {
      $.ajax({
        url: '/projects',
        success: function (projects) {
          projects = pub.reconcileProjectOrder(projects);
          TT.Utils.localStorage('projects', projects);
          useProjectData(projects.project);
        }
      });
    }
  };

  pub.requestAllIterations = function () {
    TT.Model.Project.each(function (index, project) {
      TT.Ajax.start();
      $.ajax({
        url: '/iterations',
        data: { projectID: project.id },
        success: function (iterations) {
          if (iterations && iterations.iteration) {
            pub.addIterations(project, iterations.iteration);
            TT.View.drawStories();
          } else {
            var note = 'Invalid response from the server. Did you enter the right token?';
            TT.View.message(note, { type: 'error' });
          }
          TT.Ajax.end();
        }
      });
    });
    TT.View.updateColumnDimensions();
  };

  pub.addProjects = function (projects) {
    $.each(TT.Utils.normalizePivotalArray(projects), function (index, project) {
      TT.Model.Project.overwrite(project);
      if (project.memberships && project.memberships.membership) {
        var memberships = TT.Utils.normalizePivotalArray(project.memberships.membership);
        $.each(memberships, function (index, membership) {
          TT.Model.User.overwrite(membership, 'name');
        });
      }
      if (TT.Utils.isString(project.labels)) {
        $.each(project.labels.split(','), function (index, label) {
          TT.Model.Label.overwrite({ name: label }, 'name');
        });
      }
    });
  };

  pub.addIterations = function (project, iterations) {
    // This assumes first iteration is always current.
    var normalized_iteration = 0;
    $.each(TT.Utils.normalizePivotalArray(iterations), function (index, iteration) {
      TT.Model.Iteration.overwrite({
        project_name: project.name,
        id: project.id + '.' + iteration.id,
        number: iteration.number,
        team_strength: iteration.team_strength,
        start: iteration.start,
        finish: iteration.finish
      });
      if (iteration.stories && iteration.stories.story) {
        var stories = TT.Utils.normalizePivotalArray(iteration.stories.story);
        $.each(stories, function (index, story) {
          story.current_iteration = normalized_iteration;
          TT.Model.Story.overwrite(story);
        });
      }
      normalized_iteration++;
    });
  };

  pub.reconcileProjectOrder = function (projects) {
    var existing = TT.Utils.localStorage('projects');
    if (!existing) {
      return projects;
    }
    existing = JSON.parse(existing);
    projects.project = TT.Utils.reconcileArrayOrder('id', existing.project, projects.project);

    return projects;
  };

  pub.setUpdateInterval = function () {
    setInterval(function () {
      if ($.cookie('pivotalToken')) {
        pub.requestProjectsAndIterations(true);
      }
    }, 1000 * 60 * 5);
  };

  pub.initMarked = function () {
    if (window.marked) {
      window.marked.setOptions({
        breaks: true,
        gfm: true,
        pedantic: false,
        tables: false
      });
    }
  };

  pub.moduleInit = function () {
    $.each(TT, function (moduleName, module) {
      if (moduleName !== 'Init' && TT.Utils.isObject(module) &&
        TT.Utils.isFunction(module.init)) {
        module.init();
      }
    });
  };

  pub.resetUI = function () {
    $('#filters .filter').remove();
    $('#projects .projects').remove();

    TT.Workspace.preload();

    pub.preloadColumns();
    pub.restoreFilters();
    pub.preloadFilters();
    pub.setLayout();

    TT.View.drawColumns();
    TT.View.drawColumnListNav();
    TT.View.updateColumnDimensions();
  };

  pub.workspaceRefresh = function () {
    TT.Model.Column.flush();
    TT.Model.Filter.flush();
    TT.Model.Layout.flush();

    pub.resetUI();

    var projects = TT.Utils.localStorage('projects') || {};
    TT.View.drawProjectList(JSON.parse(projects).project);
    pub.setInactiveProjects();

    TT.View.drawStories();
  };

  pub.init = function () {
    if (pub.firstRun) {
      TT.View.drawPageLayout();
      pub.loadGoogleAnalytics();
    } else {
      $.each(TT.Model, function (index, model) {
        if (model.flush) {
          model.flush();
        }
      });
    }

    pub.resetUI();

    if (pub.firstRun) {
      $(window).resize(TT.View.updateColumnDimensions);
      pub.moduleInit();
      pub.setUpdateInterval();
      pub.initMarked();
      if (TT.Utils.localStorage('fullscreen') === 'true') {
        TT.UI.toggleFullscreen();
      }
    }

    if ($.cookie('pivotalToken')) {
      pub.requestProjectsAndIterations();
    } else {
      TT.View.drawAccountSettingsForm();
    }

    pub.firstRun = false;
  };

  pub.loadGoogleAnalytics = function () {
    window._gaq = window._gaq || [];
    window._gaq.push(['_setAccount', 'UA-39159096-1']);
    window._gaq.push(['_trackPageview']);

    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') +
      '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
  };

  return pub;

}());

// bind init to jQuery on DOM Ready

if (TT.autoStart !== false) {
  $(TT.Init.init);
}
