function SystemErrors({ errors = [] }) {
  return (
    <section className="card">
      <h2>System Errors</h2>

      {errors.length === 0 ? (
        <p>No system errors recorded.</p>
      ) : (
        <div className="log-container">
          {errors.map((error) => (
            <div key={error.id} className="log-entry">
              <span>
                {error.timestamp} | {error.code}
              </span>
              <p>{error.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SystemErrors;