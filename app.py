from flask import Flask, render_template
from routes.sensor_routes import sensor_bp

app = Flask(__name__)

# Blueprint 등록
app.register_blueprint(sensor_bp)

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
