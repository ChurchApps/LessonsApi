# LessonsApi

A Node.js API providing the backend for Lessons.church

### Dev Setup Instructions

1. Create a MySQL database named `lessons`
2. Copy `dotenv.sample.txt` to `.env` and edit it to point to your MySQL database.
3. Install the dependencies with: `npm install`
4. Create the database tables with `npm run initdb`
5. Start the api with `npm run dev`

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Dev Notes

For uploaded files to show up when developing locally run `mklink /D content ..\LessonsApp\public\content` to create a virtual link on Windows.
