const router = require('express').Router();
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const schemas = require('../validators/schemas');
const tasks = require('../controllers/task.controller');

router.use(requireAuth);

router.get('/', validate({ query: schemas.listTasks }), tasks.list);
router.get('/stats', tasks.stats);
router.post('/', validate({ body: schemas.createTask }), tasks.create);
router.patch('/:id', validate({ params: schemas.idParam, body: schemas.updateTask }), tasks.update);
router.delete('/:id', validate({ params: schemas.idParam }), tasks.remove);

module.exports = router;
