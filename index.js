var fs = require("fs");
var Handlebars = require("handlebars");
var moment = require('moment');

COURSES_COLUMNS = 3;

PREPEND_SUMMARY_CATEGORIES = [
  "work",
  "volunteer",
  "awards",
  "publications"
];

function validateArray(arr) {
  return arr !== undefined && arr !== null && arr instanceof Array && arr.length > 0;
}

function render(resume) {
  resume.basics.website = removeHttp(resume.basics.website);

  // Split courses into 3 columns
  if (validateArray(resume.education)) {
    resume.education.forEach(function(block) {
      formatStartAndEndDate(block);

      if (validateArray(block.courses)) {
        splitCourses = [];
        columnIndex = 0;
        for (var i = 0; i < COURSES_COLUMNS; i++) {
          splitCourses.push([]);
        }
        block.courses.forEach(function(course) {
          splitCourses[columnIndex].push(course);
          columnIndex++;
          if (columnIndex >= COURSES_COLUMNS) {
            columnIndex = 0;
          }
        });
        block.courses = splitCourses;
      }
    });
  }

  function formatDate(date) {
    const DATE_FORMAT_INPUT = 'YYYY-MM-DD'; // resume.json standard date format

    const format = resume.basics.customSettings.showYearOnly ? 'YYYY' : 'MMMM YYYY';

    return moment(date, DATE_FORMAT_INPUT).format(format);
  }

  // SR modified:
  function formatStartAndEndDate(block) {
    if (block.startDate) {
      block.startDate = formatDate(block.startDate);
    }
    if (block.endDate) {
      block.endDate = formatDate(block.endDate);
    }
  }

  PREPEND_SUMMARY_CATEGORIES.forEach(function(category) {
    if (resume[category] !== undefined) {
      resume[category].forEach(function(block) {
        if (block.highlights === undefined) {
          block.highlights = [];
        }

        // SR modified:
        formatStartAndEndDate(block);

        // allow highlights to have a hierarchy:
        const hierarchicalHighlights = [];

        let currentLi = null;

        block.highlights
        .map(h => removeHttp(h))
        .forEach(h => {
          if(h.trim().indexOf("-") === 0) {

            if(!currentLi) {
              currentLi = {
                items: []
              };
            }
            if(!currentLi.items) {
              currentLi.items = [];
            }
            // remove the leading spaces and -
            h = h.trim().substr(1);
            currentLi.items.push(h);
          } else {

            if(currentLi) {
              hierarchicalHighlights.push(currentLi);
            }

            currentLi = {
              summary: h
            };
         }
        });

        if(currentLi) {
          hierarchicalHighlights.push(currentLi);
          currentLi = null;
        }

        block.highlights = hierarchicalHighlights;

        if (block.summary) {
          block.highlights.unshift( {
            summary: block.summary
          });

          delete block.summary;
        }

        // allow us to add blank lines, to avoid page break in middle of a block:
        if(block.onepage_blankLinesForPrinting) {
          block.blankLinesForPrinting = [];
          // Add a dummy list - easier in JS than in hbs:
          for(let i=0; i < block.onepage_blankLinesForPrinting; i++) {
            block.blankLinesForPrinting.push(" ");
          }
        }

        if(block.position==="Courses and Certificates") {
          block.extraCss = "coursesAndCertificates";
        }

        // END SR modified
      });
    }
  });

	var css = fs.readFileSync(__dirname + "/style.css", "utf-8");
	var tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");
	return Handlebars.compile(tpl)({
		css: css,
		resume: resume
	});
}

// SR modified
// printing http is just a waste of ink!
function removeHttp(text) {
  const tokens = [
    "http://", "https://",
    "www."
  ]

  while(tokens.some(t => text.indexOf(t) >=0 )) {
    tokens.forEach(t => {
      text = text.replace(t, "");
    });
  };

  return text;
}
// END SR modified

module.exports = {
	render: render
};
