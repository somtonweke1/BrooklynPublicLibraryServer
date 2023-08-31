import express from 'express';
import jwt from 'jsonwebtoken';
import pgPromise from 'pg-promise';

const app = express();
app.use(express.json());

//  database simulation
const database = {
  patrons: {
    'patron123': {
      id: 'patron123',
      name: 'Mike John'
    }
  },
  bookshelves: {
    'patron123': {
      version: 123,
      books: ['book1', 'book2']
    }
  }
};

const pgp = pgPromise();
const db = pgp('postgres://username:password@localhost:3002/postgres');

const authenticatePatron = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key'); 
    if (decoded && decoded.patron) {
      req.patron = decoded.patron;
      next();
    } else {
      res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (err) {
    console.log("JWT Error:", err); // logging
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

async function getPatronBookshelfVersion(patronId) {
  //  fetch the patron's bookshelf version from the database
  if (database.bookshelves[patronId]) {
    return database.bookshelves[patronId].version;
  } else {
    throw new Error('Patron bookshelf not found');
  }
}

async function getUpdatedBookshelves(patronVersion) {
  // fetch updated bookshelves based on the patron's version from the database
  const allBooks = ['book1', 'book2', 'book3', 'book4'];
  
  if (patronVersion === database.bookshelves['patron123'].version) {
    return [];
  } else {
    const updatedBooks = allBooks.slice(patronVersion);
    return updatedBooks;
  }
}

async function updatePatronBookshelf(patronId, bookshelfData) {
  //  update the patron's bookshelf data in the database
  database.bookshelves[patronId].version += 1;
  database.bookshelves[patronId].books = bookshelfData;
}

app.post('/login', async (req, res) => {
  const patron = { id: 'patron123' }; // Simulated patron

  jwt.sign({ patron }, 'your_secret_key', { expiresIn: '1h' }, (err, token) => {
    if (err) {
      console.log("JWT Signing Error:", err); // Added logging
      throw err;
    }
    res.json({ token });
  });
});

app.get('/bookshelf', authenticatePatron, async (req, res) => {
  const patronId = req.patron.id;
  try {
    const patronVersion = await getPatronBookshelfVersion(patronId);
    const updatedBookshelves = await getUpdatedBookshelves(patronVersion);

    res.json({ patronVersion, updatedBookshelves });
  } catch (err) {
    console.log("Database Error:", err); // logging
    res.status(500).json({ msg: 'Server error' });
  }
});

app.put('/bookshelf', authenticatePatron, async (req, res) => {
  const patronId = req.patron.id;
  const { bookshelfData } = req.body;

  try {
    await updatePatronBookshelf(patronId, bookshelfData);
    res.json({ msg: 'Bookshelf updated successfully' });
  } catch (err) {
    console.log("Database Update Error:", err); // logging
    res.status(500).json({ msg: 'Server error' });
  }
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});